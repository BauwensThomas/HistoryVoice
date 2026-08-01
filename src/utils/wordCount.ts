// Calcul du nombre de mots cible par langue, âge et durée
// Utilise les tables calibrées sauvegardées (ou les valeurs par défaut)

import { AGE_IDS } from '../config/ttsVoices';
import { getMotsCible } from '../services/calibrationStore';

/**
 * Calcule la vitesse de lecture en fonction de l'âge
 */
export function calculerVitesseLecture(age: number): number {
  if (age <= 4) return 0.8;
  if (age <= 7) return 0.85;
  if (age <= 11) return 0.9;
  if (age <= 15) return 0.95;
  return 1.0;
}

/**
 * Calcule le nombre de mots nécessaire pour une durée donnée (formule simple)
 */
export function calculerNombreMots(dureeMinutes: number, age: number): number {
  const vitesse = calculerVitesseLecture(age);
  const motsParSeconde = 2.5 * vitesse;
  return Math.round(motsParSeconde * dureeMinutes * 60);
}

/**
 * Obtient le nombre de mots cible calibré par langue/âge/durée.
 * Délègue au calibrationStore qui utilise les valeurs sauvegardées
 * (ou les valeurs par défaut si aucune calibration n'a été faite).
 * Accepte les clés courtes (fr, en) et longues (fr-FR, en-US).
 */
export function obtenirNombreMotsCible(
  dureeMinutes: number,
  age: number,
  langueId: string,
): number {
  return getMotsCible(dureeMinutes, age, langueId);
}

/**
 * Convertit un âge en index de tranche pour les tableaux de calibration
 * 6 tranches: 0=≤4ans, 1=≤7ans, 2=≤11ans, 3=≤15ans, 4=≤20ans, 5=25+
 */
export function getTrancheIndex(age: number): number {
  if (age <= 4) return 0;
  if (age <= 7) return 1;
  if (age <= 11) return 2;
  if (age <= 15) return 3;
  if (age <= 20) return 4;
  return 5;
}

/**
 * Transforme l'index d'âge sélectionné en âge numérique
 */
export function getAgeFromIndex(index: number): number {
  return AGE_IDS[index] ?? 10;
}
