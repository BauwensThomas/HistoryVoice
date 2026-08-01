// Mapping des voix Google Cloud TTS par langue et genre
export interface VoiceConfig {
  languageCode: string;
  female: string;
  male: string;
}

export const TTS_VOICES: Record<string, VoiceConfig> = {
  fr: {
    languageCode: 'fr-FR',
    female: 'fr-FR-Neural2-C',
    male: 'fr-FR-Neural2-B',
  },
  en: {
    languageCode: 'en-US',
    female: 'en-US-Neural2-F',
    male: 'en-US-Neural2-D',
  },
  it: {
    languageCode: 'it-IT',
    female: 'it-IT-Wavenet-A',
    male: 'it-IT-Wavenet-C',
  },
  es: {
    languageCode: 'es-ES',
    female: 'es-ES-Neural2-A',
    male: 'es-ES-Neural2-B',
  },
  pt: {
    languageCode: 'pt-BR',
    female: 'pt-BR-Neural2-A',
    male: 'pt-BR-Neural2-B',
  },
  nl: {
    languageCode: 'nl-NL',
    female: 'nl-NL-Wavenet-A',
    male: 'nl-NL-Wavenet-B',
  },
  de: {
    languageCode: 'de-DE',
    female: 'de-DE-Neural2-C',
    male: 'de-DE-Neural2-B',
  },
  ar: {
    languageCode: 'ar-XA',
    female: 'ar-XA-Wavenet-A',
    male: 'ar-XA-Wavenet-B',
  },
  tr: {
    languageCode: 'tr-TR',
    female: 'tr-TR-Wavenet-A',
    male: 'tr-TR-Wavenet-B',
  },
  pl: {
    languageCode: 'pl-PL',
    female: 'pl-PL-Wavenet-A',
    male: 'pl-PL-Wavenet-B',
  },
};

// Noms complets pour les prompts (toujours en anglais pour le LLM)
export const LANGUAGE_FULLNAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  pt: 'Portuguese',
  nl: 'Dutch',
  de: 'German',
  ar: 'Arabic',
  tr: 'Turkish',
  pl: 'Polish',
};

// IDs de langue
export const LANGUAGE_IDS = ['fr', 'en', 'it', 'es', 'pt', 'nl', 'de', 'ar', 'tr', 'pl'] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

// IDs numériques pour les tranches d'âge
export const AGE_IDS = [3, 6, 10, 14, 18, 25];
