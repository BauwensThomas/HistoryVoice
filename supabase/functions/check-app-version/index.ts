import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Version minimale requise pour utiliser l'app. Redéployer cette seule
// fonction (`supabase functions deploy check-app-version`) pour forcer une
// mise à jour, sans avoir besoin de publier un nouveau build.
//
// IMPORTANT : ne jamais mettre une version plus récente que celle
// réellement disponible/publiée sur le Play Store — sinon tous les
// utilisateurs actuels se retrouvent bloqués avec un bouton "Mettre à
// jour" qui pointe vers une version qui n'existe pas encore côté Store.
// Ne remonter ce numéro qu'une fois la nouvelle version confirmée live.
const MIN_VERSION_ANDROID = "2.2.1";

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ minVersionAndroid: MIN_VERSION_ANDROID }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
