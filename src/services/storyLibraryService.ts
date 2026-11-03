// Service Bibliothèque d'histoires - sauvegarde/liste/suppression
// Même pattern que supabaseService.ts : supabase.functions.invoke()
import { supabase } from '../lib/supabaseClient';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { reportError } from './errorReportService';

// Lit la réponse d'erreur d'une Edge Function. Ne se fie pas à `instanceof` (qui peut échouer si
// la classe d'erreur est dupliquée) : on regarde simplement si l'erreur porte une réponse HTTP.
// `_status` et `_raw` servent au rapport d'erreur (le corps ne peut être lu qu'une fois).
async function getErrorBody(error: any): Promise<any> {
  const ctx = error?.context;
  if (error instanceof FunctionsHttpError || (ctx && typeof ctx.text === 'function')) {
    let raw = '';
    try {
      raw = await ctx.text();
    } catch {
      // corps illisible
    }
    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      // réponse non JSON (erreur de la plateforme par exemple)
    }
    return {
      ...(json ?? {}),
      error: json?.error ?? (raw || error?.message || String(error)),
      _status: ctx?.status,
      _raw: raw.slice(0, 500),
    };
  }
  return { error: error?.message || String(error) };
}

// Erreur lisible par reportError : code HTTP + texte de la réponse du serveur.
function toReportable(body: any, error: unknown): Error {
  const reportable: any = new Error(String(body?.error ?? (error as any)?.message ?? 'erreur'));
  reportable.httpStatus = body?._status;
  reportable.rawBody = body?._raw;
  return reportable;
}

export interface SaveStoryParams {
  texte: string;
  audioBase64: string;
  age?: number;
  ageLabel?: string;
  sexe?: string;
  genre?: string;
  moment?: string;
  dureeSecondes?: number;
  langueId?: string;
  voixId?: string;
  description?: string;
}

export interface SavedStory {
  id: number;
  texte: string;
  ageLabel?: string;
  sexe?: string;
  genre?: string;
  moment?: string;
  dureeSecondes?: number;
  langueId?: string;
  description?: string;
  createdAt: string;
  audioUrl: string | null;
}

export type SaveStoryResult =
  | { success: true; id: number }
  | { success: false; limitReached: boolean; limit?: number; isPremium?: boolean };

/**
 * Sauvegarde une histoire générée dans la bibliothèque de l'utilisateur.
 * La limite (3 histoires en gratuit, 20 en premium) est vérifiée côté serveur.
 */
export async function sauvegarderHistoire(
  params: SaveStoryParams,
): Promise<SaveStoryResult> {
  try {
    const { data, error } = await supabase.functions.invoke('save-story', {
      body: params,
    });

    if (error) {
      const body = await getErrorBody(error);
      console.error('[Supabase] sauvegarderHistoire error:', body);
      if (body?.error !== 'limit_reached') {
        reportError('bibliotheque-sauvegarde', toReportable(body, error), {
          'Taille audio (base64)': params.audioBase64.length,
          'Taille texte': params.texte.length,
          'Durée (s)': params.dureeSecondes,
        });
      }
      return {
        success: false,
        limitReached: body?.error === 'limit_reached',
        limit: body?.limit,
        isPremium: body?.isPremium,
      };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Erreur sauvegarderHistoire:', error);
    reportError('bibliotheque-sauvegarde', error, {
      'Taille audio (base64)': params.audioBase64.length,
      'Taille texte': params.texte.length,
      'Durée (s)': params.dureeSecondes,
    });
    return { success: false, limitReached: false };
  }
}

/**
 * Liste les histoires sauvegardées de l'utilisateur, triées de la plus récente à la plus ancienne.
 */
export async function listerHistoires(): Promise<SavedStory[]> {
  try {
    const { data, error } = await supabase.functions.invoke('list-stories');

    if (error) {
      const body = await getErrorBody(error);
      console.error('[Supabase] listerHistoires error:', body);
      reportError('bibliotheque-liste', toReportable(body, error));
      return [];
    }

    return data?.stories ?? [];
  } catch (error) {
    console.error('Erreur listerHistoires:', error);
    reportError('bibliotheque-liste', error);
    return [];
  }
}

/**
 * Supprime une histoire sauvegardée (et son fichier audio).
 */
export async function supprimerHistoire(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('delete-story', {
      body: { id },
    });

    if (error) {
      const body = await getErrorBody(error);
      console.error('[Supabase] supprimerHistoire error:', body);
      reportError('bibliotheque-suppression', toReportable(body, error));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur supprimerHistoire:', error);
    reportError('bibliotheque-suppression', error);
    return false;
  }
}
