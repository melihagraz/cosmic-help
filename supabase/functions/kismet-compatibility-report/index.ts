import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vtnuirobrtswsjoxkkpl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing API keys");
    }

    const { match_id } = await req.json();
    if (!match_id) throw new Error("match_id required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get match
    const { data: match, error: matchError } = await supabase
      .from("weekly_matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (matchError || !match) throw new Error("Match not found");

    // Get both profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", [match.user_a, match.user_b]);

    if (!profiles || profiles.length !== 2) throw new Error("Profiles not found");

    const profileA = profiles.find((p: any) => p.id === match.user_a);
    const profileB = profiles.find((p: any) => p.id === match.user_b);

    // Determine language (default Turkish)
    const lang = "tr";

    const systemPrompt = lang === "tr"
      ? `Sen Cosmic Help'in kozmik eşleştirme uzmanısın. İki kişinin burç uyumunu romantik ve mistik bir dille yorumluyorsun.
Sıcak, umut verici ama gerçekçi ol. Kullanıcılara 'sen' diye hitap etme, üçüncü şahıs kullan.
4-5 paragraf yaz. Her paragrafın başında bir emoji kullan.`
      : `You are Cosmic Help's cosmic matchmaker. You interpret zodiac compatibility between two people in a romantic and mystical way.
Be warm, hopeful but realistic. Use third person. Write 4-5 paragraphs. Start each paragraph with an emoji.`;

    const userMessage = lang === "tr"
      ? `Kozmik Uyum Raporu oluştur:

Kişi 1: ${profileA.name}, ${profileA.zodiac_sign} burcu, ${profileA.gender}, ${new Date().getFullYear() - profileA.birth_year} yaş, ${profileA.city}
İlgi alanları: ${profileA.focus?.join(", ") || "belirtilmemiş"}
${profileA.bio ? `Hakkında: ${profileA.bio}` : ""}

Kişi 2: ${profileB.name}, ${profileB.zodiac_sign} burcu, ${profileB.gender}, ${new Date().getFullYear() - profileB.birth_year} yaş, ${profileB.city}
İlgi alanları: ${profileB.focus?.join(", ") || "belirtilmemiş"}
${profileB.bio ? `Hakkında: ${profileB.bio}` : ""}

Uyum skoru: %${Math.round(match.compatibility_score * 100)}

Element uyumu, iletişim tarzları, potansiyel zorluklar ve kozmik tavsiye hakkında yorum yap.`
      : `Generate a Cosmic Compatibility Report:

Person 1: ${profileA.name}, ${profileA.zodiac_sign}, ${profileA.gender}, age ${new Date().getFullYear() - profileA.birth_year}, ${profileA.city}
Interests: ${profileA.focus?.join(", ") || "not specified"}
${profileA.bio ? `About: ${profileA.bio}` : ""}

Person 2: ${profileB.name}, ${profileB.zodiac_sign}, ${profileB.gender}, age ${new Date().getFullYear() - profileB.birth_year}, ${profileB.city}
Interests: ${profileB.focus?.join(", ") || "not specified"}
${profileB.bio ? `About: ${profileB.bio}` : ""}

Compatibility score: ${Math.round(match.compatibility_score * 100)}%

Comment on element harmony, communication styles, potential challenges, and cosmic advice.`;

    // Call Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

    const data = await response.json();
    const report = data.content?.[0]?.text || "";

    // Save report to match
    await supabase
      .from("weekly_matches")
      .update({ compatibility_report: report })
      .eq("id", match_id);

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
