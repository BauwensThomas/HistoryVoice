// Envoie un rapport d'erreur par mail (via l'Edge Function report-error) pour assurer un suivi.
// Ne doit jamais lui-même provoquer d'erreur visible : tout est avalé.
import { Platform } from 'react-native';
import i18n from '../i18n';
import { version } from '../../package.json';
import { supabase } from '../lib/supabaseClient';

const COOLDOWN_MS = 10 * 60 * 1000;
const lastSentByStep = new Map<string, number>();

/**
 * Décrit une erreur avec tout ce qui aide à la comprendre : nom, message, code HTTP et texte de la
 * réponse du serveur (le message "Edge Function returned a non-2xx status code" seul ne dit rien).
 */
async function describeError(error: unknown): Promise<string> {
  if (typeof error === 'string') return error;
  const e: any = error;
  if (!e || typeof e !== 'object') return String(error ?? '');

  const lines: string[] = [];
  if (e.name || e.message) lines.push(`${e.name ?? 'Error'}: ${e.message ?? ''}`);

  // Erreurs de supabase.functions.invoke : la réponse HTTP (ou l'erreur réseau) est dans `context`.
  const ctx = e.context;
  if (ctx && typeof ctx === 'object') {
    if (typeof ctx.status === 'number') {
      lines.push(`HTTP ${ctx.status}${ctx.statusText ? ` ${ctx.statusText}` : ''}`);
    }
    if (typeof ctx.clone === 'function') {
      try {
        const text = await ctx.clone().text();
        if (text) lines.push(`Réponse du serveur : ${text.slice(0, 500)}`);
      } catch {
        // corps déjà lu
      }
    } else if (ctx.message) {
      lines.push(`Cause : ${ctx.name ?? ''} ${ctx.message}`.trim());
    }
  }

  // Détails déjà extraits par les services (corps de la réponse consommé avant le rapport).
  if (typeof e.httpStatus === 'number') lines.push(`HTTP ${e.httpStatus}`);
  if (e.rawBody) lines.push(`Réponse du serveur : ${String(e.rawBody).slice(0, 500)}`);

  if (!lines.length) {
    try {
      lines.push(JSON.stringify(e).slice(0, 500));
    } catch {
      lines.push(String(e));
    }
  }
  return lines.join('\n');
}

/** Un mail max toutes les 10 minutes par type d'erreur (étape) et par appareil. */
export async function reportError(
  step: string,
  error: unknown,
  extra?: Record<string, string | number | undefined>,
): Promise<void> {
  try {
    const now = Date.now();
    if (now - (lastSentByStep.get(step) ?? 0) < COOLDOWN_MS) return;
    lastSentByStep.set(step, now);

    const constants: any = (Platform as any).constants ?? {};
    const device = [constants.Brand, constants.Model].filter(Boolean).join(' ');
    const lines = [await describeError(error)];
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined) lines.push(`${key} : ${value}`);
      }
    }
    lines.push(`Appareil : ${device || 'inconnu'} (Android ${constants.Release ?? '?'}, API ${Platform.Version})`);

    await supabase.functions.invoke('report-error', {
      body: {
        step,
        message: lines.join('\n'),
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
