import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1h
const FREE_TIER_LIMIT = 3;
const PREMIUM_TIER_LIMIT = 20;

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

    // Lire le statut premium côté serveur : un compte redevenu gratuit ne voit
    // que ses N histoires les plus récentes (les plus anciennes restent en base,
    // jamais supprimées, et réapparaissent si l'utilisateur redevient premium).
    const { data: userData } = await supabase
      .from("users")
      .select("premium_jusqua")
      .eq("uid", uid)
      .single();

    const isPremium =
      !!userData?.premium_jusqua && new Date(userData.premium_jusqua) > new Date();
    const limit = isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT;

    const { data: rows, error } = await supabase
      .from("stories")
      .select(
        "id, texte, age_label, sexe, genre, moment, duree_secondes, langue_id, description, audio_path, created_at"
      )
      .eq("uid", uid)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Erreur lecture stories:", error);
      return new Response(
        JSON.stringify({ error: "Read failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stories = await Promise.all(
      (rows ?? []).map(async row => {
        const { data: signed } = await supabase.storage
          .from("story-audio")
          .createSignedUrl(row.audio_path, SIGNED_URL_EXPIRY_SECONDS);

        return {
          id: row.id,
          texte: row.texte,
          ageLabel: row.age_label,
          sexe: row.sexe,
          genre: row.genre,
          moment: row.moment,
          dureeSecondes: row.duree_secondes,
          langueId: row.langue_id,
          description: row.description,
          createdAt: row.created_at,
          audioUrl: signed?.signedUrl ?? null,
        };
      })
    );

    return new Response(
      JSON.stringify({ stories }),
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
