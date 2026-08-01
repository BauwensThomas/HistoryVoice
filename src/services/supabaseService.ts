// Service Supabase - Gestion des utilisateurs et crédits
// Utilise supabase.functions.invoke() qui gère automatiquement
// les headers apikey + Authorization (JWT utilisateur)
import { supabase } from '../lib/supabaseClient';
import { FunctionsHttpError } from '@supabase/supabase-js';

/**
 * Helper pour extraire le corps de la réponse d'erreur d'une Edge Function
 */
async function getErrorDetails(error: any): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return JSON.stringify(body);
    } catch {
      return error.message;
    }
  }
  return error?.message || String(error);
}

/**
 * Vérifie/crée l'utilisateur dans Supabase après login.
 * Le uid et l'email sont extraits du token Supabase côté serveur.
 */
export async function verifierUtilisateurSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('verify-user');
    if (error) {
      const details = await getErrorDetails(error);
      console.error('[Supabase] verifyUser error:', details);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur Supabase verifierUtilisateur:', error);
    return false;
  }
}

/**
 * Charge les crédits restants de l'utilisateur (en secondes).
 */
export async function chargerCredits(): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('get-credits');

    if (error) {
      const details = await getErrorDetails(error);
      console.error('[Supabase] chargerCredits error details:', details);
      return 0;
    }

    return data?.credits_secondes ?? 0;
  } catch (error) {
    console.error('Erreur chargerCredits:', error);
    return 0;
  }
}

/**
 * Indique si l'utilisateur a un statut premium actif (zéro pub).
 */
export async function chargerStatutPremium(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('get-credits');

    if (error) {
      const details = await getErrorDetails(error);
      console.error('[Supabase] chargerStatutPremium error details:', details);
      return false;
    }

    return data?.is_premium ?? false;
  } catch (error) {
    console.error('Erreur chargerStatutPremium:', error);
    return false;
  }
}

/**
 * Déduit des crédits après génération.
 * Le calcul du nouveau solde est fait CÔTÉ SERVEUR (anti-triche).
 */
export async function deduireCredits(
  secondesAConsommer: number,
): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('deduct-credits', {
      body: { seconds: secondesAConsommer },
    });

    if (error) {
      const details = await getErrorDetails(error);
      console.error('Erreur deduireCredits:', details);
      return 0;
    }

    return data?.credits_secondes ?? 0;
  } catch (error) {
    console.error('Erreur deduireCredits:', error);
    return 0;
  }
}
