// Envoie un rapport d'erreur par mail (via l'Edge Function report-error) pour assurer un suivi.
// Ne doit jamais lui-même provoquer d'erreur visible : tout est avalé.
import { Platform } from 'react-native';
import i18n from '../i18n';
import { version } from '../../package.json';
import { supabase } from '../lib/supabaseClient';

const COOLDOWN_MS = 10 * 60 * 1000;
const lastSentByStep = new Map<string, number>();

// Un mail max toutes les 10 minutes par type d'erreur (étape) et par appareil.
export async function reportError(step: string, error: unknown): Promise<void> {
  try {
    const now = Date.now();
    if (now - (lastSentByStep.get(step) ?? 0) < COOLDOWN_MS) return;
    lastSentByStep.set(step, now);

    const message = error instanceof Error ? error.message : String(error ?? '');
    await supabase.functions.invoke('report-error', {
      body: {
        step,
        message,
        appVersion: version,
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        language: i18n.language,
      },
    });
  } catch {
    // silencieux
  }
}
