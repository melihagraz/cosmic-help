import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vtnuirobrtswsjoxkkpl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Profile {
  id: string;
  name: string;
  zodiac_sign: string;
  gender: string;
  gender_preference: string;
  birth_year: number;
  age_range_min: number;
  age_range_max: number;
  city: string;
  focus: string[];
  interests: string[];
  is_active: boolean;
}

// Zodiac compatibility scoring
function zodiacCompatibility(signA: string, signB: string): number {
  const elements: Record<string, string> = {
    aries: "fire", leo: "fire", sagittarius: "fire",
    taurus: "earth", virgo: "earth", capricorn: "earth",
    gemini: "air", libra: "air", aquarius: "air",
    cancer: "water", scorpio: "water", pisces: "water",
  };

  const elA = elements[signA] || "unknown";
  const elB = elements[signB] || "unknown";

  if (signA === signB) return 0.75;
  if (elA === elB) return 0.90;
  if ((elA === "fire" && elB === "air") || (elA === "air" && elB === "fire") ||
      (elA === "earth" && elB === "water") || (elA === "water" && elB === "earth")) return 0.80;
  if ((elA === "fire" && elB === "water") || (elA === "water" && elB === "fire") ||
      (elA === "earth" && elB === "air") || (elA === "air" && elB === "earth")) return 0.55;
  return 0.65;
}

// Jaccard similarity for arrays
function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
  return monday.toISOString().split("T")[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing service role key");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const weekStart = getCurrentWeekStart();

    // Check if matches already generated this week (idempotent)
    const { count } = await supabase
      .from("weekly_matches")
      .select("*", { count: "exact", head: true })
      .eq("week_start", weekStart);

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Matches already generated", count }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true);

    if (error || !profiles || profiles.length < 2) {
      return new Response(
        JSON.stringify({ success: true, message: "Not enough profiles", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing match history to avoid repeat matches
    const { data: history } = await supabase.from("match_history").select("*");
    const historySet = new Set((history || []).map((h: any) => `${h.user_a}_${h.user_b}`));

    // Generate all valid candidate pairs with scores
    const candidates: { a: Profile; b: Profile; score: number }[] = [];

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const a = profiles[i] as Profile;
        const b = profiles[j] as Profile;

        // Canonical ordering
        const [first, second] = a.id < b.id ? [a, b] : [b, a];

        // Skip if previously matched
        if (historySet.has(`${first.id}_${second.id}`)) continue;

        // Gender preference check (bidirectional)
        const aAcceptsB = a.gender_preference === "everyone" || a.gender_preference === b.gender;
        const bAcceptsA = b.gender_preference === "everyone" || b.gender_preference === a.gender;
        if (!aAcceptsB || !bAcceptsA) continue;

        // Age range check (bidirectional)
        const ageA = getAge(a.birth_year);
        const ageB = getAge(b.birth_year);
        if (ageB < a.age_range_min || ageB > a.age_range_max) continue;
        if (ageA < b.age_range_min || ageA > b.age_range_max) continue;

        // Calculate composite score
        const zodiacScore = zodiacCompatibility(a.zodiac_sign, b.zodiac_sign);
        const interestScore = jaccard(a.interests || [], b.interests || []);
        const focusScore = jaccard(a.focus || [], b.focus || []);

        // City proximity bonus (simplified: same city = 1.0, different = 0.3)
        const cityScore = (a.city || "").toLowerCase() === (b.city || "").toLowerCase() ? 1.0 : 0.3;

        const score = zodiacScore * 0.6 + cityScore * 0.2 + (interestScore + focusScore) / 2 * 0.1 + 0.1;

        candidates.push({ a: first, b: second, score });
      }
    }

    // Sort by score descending
    candidates.sort((x, y) => y.score - x.score);

    // Greedy assignment: each user gets max 1 match
    const assigned = new Set<string>();
    const matches: any[] = [];

    for (const { a, b, score } of candidates) {
      if (assigned.has(a.id) || assigned.has(b.id)) continue;
      assigned.add(a.id);
      assigned.add(b.id);
      matches.push({
        week_start: weekStart,
        user_a: a.id,
        user_b: b.id,
        compatibility_score: Math.round(score * 100) / 100,
      });
    }

    // Insert matches
    if (matches.length > 0) {
      const { error: insertError } = await supabase.from("weekly_matches").insert(matches);
      if (insertError) throw insertError;

      // Insert into match_history
      const historyRecords = matches.map((m: any) => ({
        user_a: m.user_a,
        user_b: m.user_b,
        week_start: weekStart,
      }));
      await supabase.from("match_history").upsert(historyRecords, { onConflict: "user_a,user_b" });
    }

    return new Response(
      JSON.stringify({ success: true, matchesCreated: matches.length, weekStart }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
