import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing service role key");

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const anonKey = req.headers.get("apikey");

    const anonClient = createClient(SUPABASE_URL, anonKey || "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader?.replace("Bearer ", "") || ""
    );

    if (authError || !user) throw new Error("Unauthorized");

    const { match_id, action } = await req.json();
    if (!match_id || !["liked", "passed"].includes(action)) {
      throw new Error("match_id and action (liked/passed) required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get match
    const { data: match, error: matchError } = await supabase
      .from("weekly_matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (matchError || !match) throw new Error("Match not found");

    // Verify user is participant
    const isUserA = match.user_a === user.id;
    const isUserB = match.user_b === user.id;
    if (!isUserA && !isUserB) throw new Error("Not a participant");

    // Update the correct column
    const updateField = isUserA ? "user_a_action" : "user_b_action";
    const { error: updateError } = await supabase
      .from("weekly_matches")
      .update({ [updateField]: action })
      .eq("id", match_id);

    if (updateError) throw updateError;

    // Check if now mutual
    const otherAction = isUserA ? match.user_b_action : match.user_a_action;
    const isMutual = action === "liked" && otherAction === "liked";

    // If mutual, trigger compatibility report generation
    if (isMutual) {
      // Fire and forget - generate report async
      const reportUrl = `${SUPABASE_URL}/functions/v1/kismet-compatibility-report`;
      fetch(reportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ match_id }),
      }).catch(console.error);
    }

    return new Response(
      JSON.stringify({ success: true, isMutual, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
