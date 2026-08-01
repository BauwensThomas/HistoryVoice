// Service Text-to-Speech via Edge Function Supabase
// La clé Google TTS est stockée dans la table `ia` et lue côté serveur
import { supabase } from '../lib/supabaseClient';
import { TTS_VOICES } from '../config/ttsVoices';
import { calculerVitesseLecture } from '../utils/wordCount';
import RNFS from 'react-native-fs';

export interface TTSParams {
  texte: string;
  langueId: string;
  voixId: 'male' | 'female';
  age: number;
}

/**
 * Appelle l'Edge Function generate-audio pour obtenir le base64 audio.
 * Fonction partagée utilisée par genererAudio et CalibrationScreen.
 */
export async function genererAudioBase(
  text: string,
  languageCode: string,
  voiceName: string,
  speakingRate: number,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-audio', {
    body: { text, languageCode, voiceName, speakingRate },
  });

  if (error) {
    // error.message de supabase-js est générique ("Edge Function returned a non-2xx status code")
    // le détail utile (ex: erreur Google TTS) est dans le corps de la réponse HTTP.
    let details = '';
    try {
      const body = await error.context?.json();
      details = body?.details || body?.error || '';
    } catch {
      // corps non-JSON ou déjà consommé, on garde le message générique
    }
    throw new Error(details || error.message || 'TTS Error');
  }

  if (!data?.audioContent) {
    throw new Error("Pas d'audioContent dans la réponse");
  }

  return data.audioContent;
}

/**
 * Génère un fichier audio MP3 via l'Edge Function.
 * Retourne le chemin du fichier audio local.
 */
export async function genererAudio(params: TTSParams): Promise<string> {
  const { texte, langueId, voixId, age } = params;

  const voiceConfig = TTS_VOICES[langueId];
  if (!voiceConfig) {
    throw new Error(`Langue non supportée: ${langueId}`);
  }

  const voiceName = voixId === 'male' ? voiceConfig.male : voiceConfig.female;
  const speakingRate = calculerVitesseLecture(age);

  const audioContent = await genererAudioBase(
    texte,
    voiceConfig.languageCode,
    voiceName,
    speakingRate,
  );

  // Sauvegarder le fichier audio en local
  const filePath = `${RNFS.CachesDirectoryPath}/histoire_audio_${Date.now()}.mp3`;
  await RNFS.writeFile(filePath, audioContent, 'base64');

  return filePath;
}
