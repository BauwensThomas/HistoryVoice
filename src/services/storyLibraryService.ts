// Service Bibliothèque d'histoires - sauvegarde/liste/suppression
// Même pattern que supabaseService.ts : supabase.functions.invoke()
import { supabase } from '../lib/supabaseClient';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { reportError } from './errorReportService';

async function getErrorBody(error: any): Promise<any> {
  if (error instanceof FunctionsHttpError) {
    try {
      return await error.context.json();
    } catch {
      return { error: error.message };
    }
  }
  return { error: error?.message || String(error) };
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
        reportError('bibliotheque-sauvegarde', body?.error ?? error);
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
    reportError('bibliotheque-sauvegarde', error);
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
      reportError('bibliotheque-liste', body?.error ?? error);
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
      reportError('bibliotheque-suppression', body?.error ?? error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur supprimerHistoire:', error);
    reportError('bibliotheque-suppression', error);
    return false;
  }
}
