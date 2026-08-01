/**
 * CalibrationStore - Stockage persistant des tables de calibration
 *
 * Les valeurs calibrées sont sauvegardées sur l'appareil via AsyncStorage.
 * Au démarrage de l'app, on charge les valeurs sauvegardées en mémoire.
 * Si aucune calibration n'a été faite, les valeurs par défaut sont utilisées.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrancheIndex } from '../utils/wordCount';

const STORAGE_KEY = '@historyvoice_calibration_tables';

// ═══════════════════════════════════════════════════════════════
// TABLES PAR DÉFAUT (valeurs initiales de calibration)
// Format: [tranche_age][durée 1-4 min]
// Tranches: 0=≤4ans, 1=≤7ans, 2=≤11ans, 3=≤15ans, 4=≤20ans, 5=25+
// ═══════════════════════════════════════════════════════════════
const DEFAULT_TABLES: Record<string, number[][]> = {
  'fr-FR': [
    [156,334,468,676],
    [171,335,508,688],
    [185,364,559,742],
    [173,374,603,788],
    [197,398,621,796],
    [208,370,589,823],
  ],
  'en-US': [
    [134,259,389,541],
    [141,298,433,570],
    [156,268,454,582],
    [152,320,445,631],
    [155,325,505,712],
    [160,288,514,694],
  ],
  'it-IT': [
    [113,267,401,530],
    [130,274,422,567],
    [135,293,456,594],
    [146,303,472,589],
    [162,316,488,628],
    [163,330,489,676],
  ],
  'es-ES': [
    [133,293,423,579],
    [152,299,470,668],
    [165,329,512,670],
    [161,332,489,678],
    [192,355,541,701],
    [180,391,534,714],
  ],
  'nl-NL': [
    [156,330,498,667],
    [160,343,515,688],
    [171,350,551,731],
    [191,428,559,826],
    [217,412,601,830],
    [202,365,606,821],
  ],
  'pt-BR': [
    [120,245,374,498],
    [127,270,395,516],
    [151,270,414,538],
    [141,269,423,601],
    [148,314,466,616],
    [150,310,477,602],
  ],
  'de-DE': [
    [123,246,372,505],
    [133,258,397,535],
    [139,283,418,558],
    [147,286,435,632],
    [145,310,446,621],
    [150,323,441,572],
  ],
  'ar-XA': [
    [88,170,259,344],
    [87,192,276,380],
    [98,199,286,393],
    [101,211,309,406],
    [116,228,333,425],
    [105,220,322,430],
  ],
  'tr-TR': [
    [86,180,259,325],
    [98,181,268,382],
    [96,194,268,382],
    [98,206,281,418],
    [103,208,309,421],
    [105,220,329,665],
  ],
  'pl-PL': [
    [112,231,378,493],
    [121,258,384,501],
    [154,252,408,535],
    [130,266,429,555],
    [148,296,421,589],
    [144,298,441,617],
  ],
};

/** Mapping clés courtes → clés longues */
const SHORT_TO_LONG: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  it: 'it-IT',
  es: 'es-ES',
  nl: 'nl-NL',
  pt: 'pt-BR',
  de: 'de-DE',
  ar: 'ar-XA',
  tr: 'tr-TR',
  pl: 'pl-PL',
};

// Cache mémoire (chargé au démarrage)
let cachedTables: Record<string, number[][]> | null = null;

/**
 * Charge les tables calibrées depuis AsyncStorage en mémoire.
 * À appeler au démarrage de l'app (App.tsx).
 */
export async function loadCalibration(): Promise<void> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      cachedTables = JSON.parse(json);
    } else {
      // Aucune calibration sauvegardée, valeurs par défaut utilisées
    }
  } catch (error) {
    console.error('Erreur chargement calibration:', error);
  }
}

/**
 * Sauvegarde les nouvelles tables calibrées (persistant + mémoire).
 * Appelé automatiquement à la fin de la calibration.
 */
export async function saveCalibration(tables: Record<string, number[][]>): Promise<void> {
  try {
    cachedTables = tables;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    console.log('✅ Tables de calibration sauvegardées');
  } catch (error) {
    console.error('Erreur sauvegarde calibration:', error);
    throw error;
  }
}

/**
 * Retourne les tables actives (calibrées si disponibles, sinon défaut).
 * Synchrone car utilise le cache mémoire.
 */
export function getActiveTables(): Record<string, number[][]> {
  return cachedTables ?? DEFAULT_TABLES;
}

/**
 * Retourne le nombre de mots cible pour une combinaison langue/âge/durée.
 * Accepte les clés courtes (fr, en) et longues (fr-FR, en-US).
 */
export function getMotsCible(
  dureeMinutes: number,
  age: number,
  langueId: string,
): number {
  const tables = getActiveTables();

  // Normaliser la clé
  const longKey = SHORT_TO_LONG[langueId] || langueId;
  const tranche = getTrancheIndex(age);
  const dIdx = Math.max(0, Math.min(dureeMinutes - 1, 3));

  const table = tables[longKey];
  if (table) {
    return table[tranche][dIdx];
  }

  // Fallback
  return 150 * dureeMinutes;
}

/**
 * Efface les données de calibration (retour aux valeurs par défaut).
 */
export async function resetCalibration(): Promise<void> {
  cachedTables = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  console.log('🔄 Calibration réinitialisée aux valeurs par défaut');
}
