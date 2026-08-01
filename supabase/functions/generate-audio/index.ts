import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Google Cloud TTS refuse toute requête dont le texte dépasse 5000 octets UTF-8.
// On découpe avec une marge de sécurité pour rester loin de la limite exacte.
const MAX_TTS_BYTES = 4500;

function splitTextForTts(text: string): string[] {
  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= MAX_TTS_BYTES) {
    return [text];
  }

  // Découpe sur les fins de phrase pour ne pas casser l'intonation en plein milieu.
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text];

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current + sentence;
    if (encoder.encode(candidate).length > MAX_TTS_BYTES && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérifier le token Supabase
    const { uid } = await verifySupabaseToken(req);
    if (!uid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { text, languageCode, voiceName, speakingRate } = await req.json();

    if (!text || !languageCode || !voiceName) {
      return new Response(
        JSON.stringify({
          error: "text, languageCode, voiceName are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client Supabase avec service_role pour bypass RLS sur la table ia
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lire la clé Google TTS depuis la table ia
    const { data: iaData, error: iaError } = await supabase
      .from("ia")
      .select("api_key")
      .eq("type", "parle")
      .single();

    if (iaError || !iaData?.api_key) {
      console.error("Erreur lecture clé TTS:", iaError);
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer la clé TTS" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Appeler Google Cloud TTS (le texte est découpé si besoin pour rester sous la limite de 5000 octets)
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${iaData.api_key}`;
    const textChunks = splitTextForTts(text);
    const audioBuffers: Uint8Array[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const ttsResponse = await fetch(ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: textChunks[i] },
          voice: { languageCode, name: voiceName },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: speakingRate ?? 1.0,
          },
        }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        return new Response(
          JSON.stringify({
            error: `TTS API Error ${ttsResponse.status} (chunk ${i + 1}/${textChunks.length})`,
            details: errorText,
          }),
          {
            status: ttsResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const chunkData = await ttsResponse.json();
      audioBuffers.push(
        Uint8Array.from(atob(chunkData.audioContent), (c) => c.charCodeAt(0))
      );
    }

    // Concaténation binaire des MP3 (fonctionne car chaque segment est un flux MP3 valide indépendant)
    const totalLength = audioBuffers.reduce((sum, b) => sum + b.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    let binaryString = "";
    for (let i = 0; i < combined.length; i += 0x8000) {
      binaryString += String.fromCharCode(...combined.subarray(i, i + 0x8000));
    }
    const combinedAudioContent = btoa(binaryString);

    // Accumuler les caractères TTS dans users
    const chars = text.length;
    if (chars > 0) {
      const { data: userRow } = await supabase
        .from("users")
        .select("tts_chars_total")
        .eq("uid", uid)
        .single();
      await supabase
        .from("users")
        .update({ tts_chars_total: (userRow?.tts_chars_total ?? 0) + chars })
        .eq("uid", uid);
      await supabase.from("usage_logs").insert({ uid, tokens: 0, tts_chars: chars });
    }

    return new Response(
      JSON.stringify({ audioContent: combinedAudioContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
