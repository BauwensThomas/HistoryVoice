import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const {
      texte,
      audioBase64,
      age,
      ageLabel,
      sexe,
      genre,
      moment,
      dureeSecondes,
      langueId,
      voixId,
      description,
    } = await req.json();

    if (!texte || !audioBase64) {
      return new Response(
        JSON.stringify({ error: "texte and audioBase64 are required" }),
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

    // Lire le statut premium côté serveur (anti-triche)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("premium_jusqua")
      .eq("uid", uid)
      .single();

    if (userError || !userData) {
      console.error("Erreur lecture user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isPremium =
      !!userData.premium_jusqua && new Date(userData.premium_jusqua) > new Date();

    const limit = isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT;
    const { count, error: countError } = await supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("uid", uid);

    if (countError) {
      console.error("Erreur comptage stories:", countError);
      return new Response(
        JSON.stringify({ error: "Count failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if ((count ?? 0) >= limit) {
      return new Response(
        JSON.stringify({ error: "limit_reached", limit, isPremium }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Décoder l'audio base64 et l'envoyer dans Supabase Storage
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioPath = `${uid}/${crypto.randomUUID()}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("story-audio")
      .upload(audioPath, audioBytes, { contentType: "audio/mpeg" });

    if (uploadError) {
      console.error("Erreur upload audio:", uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insérer la ligne de l'histoire sauvegardée
    const { data: inserted, error: insertError } = await supabase
      .from("stories")
      .insert({
        uid,
        texte,
        audio_path: audioPath,
        age,
        age_label: ageLabel,
        sexe,
        genre,
        moment,
        duree_secondes: dureeSecondes,
        langue_id: langueId,
        voix_id: voixId,
        description,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Erreur insertion story:", insertError);
      // Nettoyer le fichier orphelin si l'insertion échoue
      await supabase.storage.from("story-audio").remove([audioPath]);
      return new Response(
        JSON.stringify({ error: "Insert failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ id: inserted.id }),
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
