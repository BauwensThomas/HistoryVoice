import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérifier le token Supabase → extraire uid
    const { uid } = await verifySupabaseToken(req);

    // Lire le nombre de secondes à déduire
    const { seconds } = await req.json();

    if (typeof seconds !== "number" || seconds <= 0) {
      return new Response(
        JSON.stringify({ error: "seconds must be a positive number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client Supabase avec service_role pour bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lire les crédits actuels côté serveur (anti-triche)
    const { data: userData, error: readError } = await supabase
      .from("users")
      .select("credits_secondes, stories_count, stories_total_seconds")
      .eq("uid", uid)
      .single();

    if (readError || !userData) {
      console.error("Erreur lecture user:", readError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculer le nouveau solde CÔTÉ SERVEUR
    const nouveauSolde = Math.max(
      0,
      (userData.credits_secondes ?? 0) - seconds
    );

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits_secondes: nouveauSolde,
        stories_count: (userData.stories_count ?? 0) + 1,
        stories_total_seconds: (userData.stories_total_seconds ?? 0) + seconds,
      })
      .eq("uid", uid);

    if (updateError) {
      console.error("Erreur déduction crédits:", updateError);
      return new Response(
        JSON.stringify({ error: "Update failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ credits_secondes: nouveauSolde }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
