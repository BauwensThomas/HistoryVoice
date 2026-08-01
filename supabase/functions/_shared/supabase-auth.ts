// Vérification sécurisée du token Supabase côté serveur
// Utilise supabase.auth.getUser() pour vérifier la signature du JWT
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SupabaseUser {
  uid: string;
  email?: string;
}

/**
 * Vérifie le token Supabase depuis l'en-tête Authorization.
 * Utilise auth.getUser(token) qui vérifie la signature côté serveur.
 * Lève une erreur si le token est invalide, expiré ou manquant.
 */
export async function verifySupabaseToken(
  req: Request
): Promise<SupabaseUser> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  // Vérification sécurisée via l'API Auth Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error("Token verification failed:", error?.message);
    throw new Error("Invalid or expired token");
  }

  return {
    uid: user.id,
    email: user.email || undefined,
  };
}
