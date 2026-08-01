// Service Groq API - Génération d'histoires via Edge Function Supabase
// La clé API Groq est stockée dans la table `ia` et lue côté serveur
import { supabase } from '../lib/supabaseClient';

export interface GroqResponse {
  texte: string;
  tokens: number;
}

/**
 * Génère une histoire avec l'IA via l'Edge Function generate-story.
 * L'Edge Function lit la clé Groq depuis la table `ia` (RLS deny all)
 * et appelle l'API Groq côté serveur.
 */
export async function genererHistoireAvecIA(prompt: string): Promise<GroqResponse> {
  const { data, error } = await supabase.functions.invoke('generate-story', {
    body: { prompt },
  });

  if (error) {
    // error.message de supabase-js est générique ("Edge Function returned a non-2xx status code")
    // le détail utile (ex: "Tous les providers IA ont échoué") est dans le corps de la réponse HTTP.
    let details = '';
    try {
      const body = await (error as any).context?.json();
      details = body?.details || body?.error || '';
    } catch {
      // corps non-JSON ou déjà consommé, on garde le message générique
    }
    throw new Error(details || error.message || 'API Error');
  }

  return {
    texte: data?.texte ?? '',
    tokens: data?.tokens ?? 0,
  };
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Génère une histoire en réessayant jusqu'à 5 fois pour s'approcher
 * du nombre de mots cible (tolérance ±10 mots).
 * Garde la meilleure tentative (la plus proche de la cible).
 * Fonctionne exactement comme le système de calibration.
 */
export async function genererHistoireAvecRetry(
  construirePromptFn: (motsCible: number, correction?: string) => string,
  motsCible: number,
): Promise<GroqResponse> {
  const maxTentatives = 5;
  const tolerance = 10;

  let meilleureHistoire = '';
  let meilleurEcart = Infinity;
  let meilleursMots = 0;
  let totalTokens = 0;
  let motsGeneres = 0;
  let tentatives = 0;

  while (tentatives < maxTentatives) {
    let prompt: string;
    if (tentatives === 0) {
      prompt = construirePromptFn(motsCible);
    } else {
      const manque = motsCible - motsGeneres;
      const correction = manque > 0
        ? `The previous story had ${motsGeneres} words, which is too SHORT by ${manque} words. Add more details, dialogues and descriptions to reach exactly ${motsCible} words.`
        : `The previous story had ${motsGeneres} words, which is too LONG by ${Math.abs(manque)} words. Shorten the descriptions to reach exactly ${motsCible} words.`;
      prompt = construirePromptFn(motsCible, correction);
    }

    let response: GroqResponse;
    try {
      response = await genererHistoireAvecIA(prompt);
    } catch (err) {
      // Échec transitoire (réseau, providers IA temporairement indisponibles) :
      // on retente au lieu d'abandonner immédiatement, sauf à la dernière tentative.
      console.warn(`[Groq] Tentative ${tentatives + 1}/${maxTentatives} en échec: ${(err as Error).message}`);
      tentatives++;
      if (tentatives < maxTentatives) {
        await sleep(3000);
        continue;
      }
      if (!meilleureHistoire) throw err;
      break;
    }

    const motsActuels = response.texte.split(/\s+/).filter(w => w.length > 0).length;
    const ecartActuel = Math.abs(motsActuels - motsCible);

    totalTokens += response.tokens;

    if (ecartActuel < meilleurEcart) {
      meilleurEcart = ecartActuel;
      meilleureHistoire = response.texte;
      meilleursMots = motsActuels;
    }

    motsGeneres = motsActuels;

    console.log(
      `[Groq] Tentative ${tentatives + 1}/${maxTentatives}: ${motsActuels} mots (cible: ${motsCible}, écart: ${ecartActuel})`,
    );

    if (ecartActuel <= tolerance) {
      console.log(`[Groq] ✅ Dans la tolérance (±${tolerance} mots)`);
      break;
    }

    tentatives++;
    if (tentatives < maxTentatives) {
      await sleep(3000);
    }
  }

  console.log(
    `[Groq] Résultat final: ${meilleursMots} mots (cible: ${motsCible}, écart: ${meilleurEcart}, tokens total: ${totalTokens})`,
  );

  return {
    texte: meilleureHistoire,
    tokens: totalTokens,
  };
}
