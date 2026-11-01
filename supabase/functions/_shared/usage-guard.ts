// Protège les fonctions qui consomment des API payantes (Groq/Gemini, Google TTS) :
// un compte connecté ne peut pas les appeler directement sans crédits, ni en rafale.
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Marge large : une histoire = jusqu'à 5 appels texte (retries de longueur) + 1 appel audio.
const LIMITS = {
  story: { column: "tokens", perHour: 40 },
  audio: { column: "tts_chars", perHour: 20 },
} as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function refuse(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Retourne une Response de refus (à renvoyer telle quelle) si l'utilisateur n'a
 * plus de crédits ou dépasse la limite horaire ; null s'il peut continuer.
 */
export async function checkUsageAllowed(
  supabase: SupabaseClient,
  uid: string,
  kind: keyof typeof LIMITS,
): Promise<Response | null> {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("credits_secondes")
    .eq("uid", uid)
    .single();

  // Pas de ligne users = compte créé sans passer par l'app : on refuse.
  if (userError || !user) return refuse(403, "Compte utilisateur introuvable");
  if ((user.credits_secondes ?? 0) <= 0) return refuse(402, "Crédits insuffisants");

  const { column, perHour } = LIMITS[kind];
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_logs")
    .select("created_at", { count: "exact", head: true })
    .eq("uid", uid)
    .gt(column, 0)
    .gte("created_at", since);

  if (countError) {
    // Ne pas bloquer un utilisateur légitime pour un souci de comptage.
    console.error("[usage-guard] comptage impossible:", countError.message);
    return null;
  }
  if ((count ?? 0) >= perHour) {
    console.warn(`[usage-guard] limite ${kind} atteinte pour ${uid}: ${count}/h`);
    return refuse(429, "Trop de demandes, réessayez plus tard");
  }
  return null;
}
