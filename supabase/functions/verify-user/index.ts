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
    // Vérifier le token Supabase → extraire uid + email
    const { uid, email } = await verifySupabaseToken(req);

    // Client Supabase avec service_role pour bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Vérifier si l'utilisateur existe déjà par email
    const { data: existingUser } = await supabase
      .from("users")
      .select("uid")
      .eq("email", email)
      .single();

    let dbError;

    if (existingUser && existingUser.uid !== uid) {
      // Mettre à jour le uid si l'email existe avec un uid différent
      const { error } = await supabase
        .from("users")
        .update({ uid })
        .eq("email", email);
      dbError = error;
    } else if (!existingUser) {
      // Nouvel utilisateur
      const { error } = await supabase
        .from("users")
        .insert({ uid, email });
      dbError = error;
    }
    // Si existingUser.uid === uid, rien à faire

    if (dbError) {
      console.error("Erreur upsert user:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
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
