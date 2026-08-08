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

    const { id } = await req.json();

    if (typeof id !== "number") {
      return new Response(
        JSON.stringify({ error: "id must be a number" }),
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

    // Vérifier que l'histoire appartient bien à l'utilisateur authentifié
    const { data: story, error: readError } = await supabase
      .from("stories")
      .select("id, audio_path")
      .eq("id", id)
      .eq("uid", uid)
      .single();

    if (readError || !story) {
      return new Response(
        JSON.stringify({ error: "Story not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.storage.from("story-audio").remove([story.audio_path]);

    const { error: deleteError } = await supabase
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("uid", uid);

    if (deleteError) {
      console.error("Erreur suppression story:", deleteError);
      return new Response(
        JSON.stringify({ error: "Delete failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
