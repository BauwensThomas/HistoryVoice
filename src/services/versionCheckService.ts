// Vérifie si une mise à jour obligatoire est disponible, via la fonction
// check-app-version (aucune auth requise, appelable avant connexion).
import { supabase } from '../lib/supabaseClient';
import { version as currentVersion } from '../../package.json';

/** Compare deux versions "x.y.z" : retourne true si `current` < `minimum`. */
function isOutdated(current: string, minimum: string): boolean {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cPart = c[i] ?? 0;
    const mPart = m[i] ?? 0;
    if (cPart < mPart) return true;
    if (cPart > mPart) return false;
  }
  return false;
}

/**
 * Retourne true si une mise à jour obligatoire est nécessaire. En cas
 * d'échec réseau, on n'affiche pas le blocage (fail-open) pour ne pas
 * pénaliser un utilisateur légitime à cause d'un problème de connexion.
 */
export async function isUpdateRequired(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('check-app-version');
    if (error || !data?.minVersionAndroid) return false;
    return isOutdated(currentVersion, data.minVersionAndroid);
  } catch {
    return false;
  }
}
