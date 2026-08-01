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

    // Client Supabase avec service_role pour bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lire les crédits et le statut premium de l'utilisateur authentifié
    const { data, error } = await supabase
      .from("users")
      .select("credits_secondes, premium_jusqua")
      .eq("uid", uid)
      .single();

    if (error) {
      console.error("Erreur lecture crédits:", error);
      return new Response(
        JSON.stringify({ credits_secondes: 0, is_premium: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isPremium = !!data.premium_jusqua && new Date(data.premium_jusqua) > new Date();

    return new Response(
      JSON.stringify({
        credits_secondes: data.credits_secondes ?? 0,
        is_premium: isPremium,
        premium_jusqua: data.premium_jusqua ?? null,
      }),
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
