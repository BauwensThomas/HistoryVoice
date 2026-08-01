import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Empêche un provider lent/bloqué de faire dépasser le temps d'exécution max de la fonction Edge.
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Appelle un provider IA et retourne { texte, tokens }
async function callProvider(
  provider: string,
  apiKey: string,
  prompt: string
): Promise<{ texte: string; tokens: number }> {
  if (provider === "cerebras") {
    const res = await fetchWithTimeout("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        max_tokens: 4096,
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Cerebras ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
      texte: data.choices?.[0]?.message?.content ?? "",
      tokens: data.usage?.total_tokens ?? 0,
    };
  }

  if (provider === "groq") {
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 4096,
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
      texte: data.choices?.[0]?.message?.content ?? "",
      tokens: data.usage?.total_tokens ?? 0,
    };
  }

  if (provider === "gemini") {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.9 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
      texte: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      tokens: data.usageMetadata?.totalTokenCount ?? 0,
    };
  }

  throw new Error(`Provider inconnu: ${provider}`);
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

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
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

    // Récupérer tous les providers 'ecrit' triés par ordre de priorité
    const { data: iaList, error: iaError } = await supabase
      .from("ia")
      .select("api_key, provider")
      .eq("type", "ecrit")
      .order("ordre", { ascending: true });

    if (iaError || !iaList?.length) {
      console.error("[generate-story] Erreur lecture clés IA:", iaError);
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer les clés API" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Essayer les providers dans l'ordre jusqu'à succès
    let texte = "";
    let tokens = 0;
    let lastError = "";

    for (const ia of iaList) {
      try {
        console.log(`[generate-story] Essai provider: ${ia.provider}`);
        const result = await callProvider(ia.provider, ia.api_key, prompt);
        if (!result.texte) {
          lastError = `${ia.provider} a renvoyé une réponse vide`;
          console.warn(`[generate-story] Échec ${ia.provider}: ${lastError}`);
          continue; // Réponse 200 mais vide (ex: filtrage de contenu) : essayer le provider suivant
        }
        texte = result.texte;
        tokens = result.tokens;
        console.log(`[generate-story] Succès avec ${ia.provider} (${tokens} tokens)`);
        break;
      } catch (err) {
        lastError = (err as Error).message;
        console.warn(`[generate-story] Échec ${ia.provider}: ${lastError}`);
        // Continuer avec le prochain provider
      }
    }

    if (!texte) {
      return new Response(
        JSON.stringify({ error: "Tous les providers IA ont échoué", details: lastError }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Accumuler les tokens dans users (chaque appel compte, y compris les retries)
    if (tokens > 0) {
      const { data: userRow } = await supabase
        .from("users")
        .select("tokens_total")
        .eq("uid", uid)
        .single();
      await supabase
        .from("users")
        .update({ tokens_total: (userRow?.tokens_total ?? 0) + tokens })
        .eq("uid", uid);
      await supabase.from("usage_logs").insert({ uid, tokens, tts_chars: 0 });
    }

    return new Response(JSON.stringify({ texte, tokens }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-story] Uncaught exception:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
