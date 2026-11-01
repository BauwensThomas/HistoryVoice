import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifySupabaseToken } from "../_shared/supabase-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REPORT_TO = "historyVoice@belgacai.com";

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").slice(0, 3000);

// Reçoit un rapport d'erreur envoyé par l'app et le transmet par mail.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { uid, email } = await verifySupabaseToken(req);
    const { step, message, appVersion, platform, osVersion, language } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "HistoryVoice Alertes <historyvoice@belgacai.com>",
        to: [REPORT_TO],
        subject: `HistoryVoice — Erreur utilisateur [${escapeHtml(step)}]`,
        html: `<h3>Erreur affichée à un utilisateur</h3>
<p>Utilisateur : ${escapeHtml(email)} (${escapeHtml(uid)})<br>
Étape : ${escapeHtml(step)}<br>
Version app : ${escapeHtml(appVersion)}<br>
Appareil : ${escapeHtml(platform)} ${escapeHtml(osVersion)}<br>
Langue : ${escapeHtml(language)}<br>
Date : ${new Date().toISOString()}</p>
<pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px">${escapeHtml(message)}</pre>`,
      }),
    });

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);

    return new Response(JSON.stringify({ status: "sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[report-error]", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
