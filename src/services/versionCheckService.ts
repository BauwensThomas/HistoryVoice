// Vérifie si une mise à jour obligatoire est disponible, via la fonction
// check-app-version (aucune auth requise, appelable avant connexion).
import { Platform } from 'react-native';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
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
 * Demande à Google Play s'il existe une version plus récente de l'app pour cet
 * appareil. Si oui, lance la mise à jour immédiate (plein écran, bloquante).
 * Retourne true si une mise à jour était disponible et n'a pas été installée
 * (refusée/annulée) : l'appelant doit alors bloquer l'app. Retourne false s'il
 * n'y en a pas, ou si la vérification est impossible (app non installée depuis
 * le Play Store, hors ligne...) — fail-open comme isUpdateRequired.
 */
export async function forcePlayStoreUpdate(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const inAppUpdates = new SpInAppUpdates(false);
    // Play ne signale AVAILABLE que si une version plus récente existe pour cet appareil.
    const result = await inAppUpdates.checkNeedsUpdate({
      customVersionComparator: () => 1,
    });
    if (!result.shouldUpdate) return false;
    await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
    return true;
  } catch {
    return false;
  }
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
