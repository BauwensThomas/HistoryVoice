import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPORT_TO = "historyVoice@belgacai.com";
const GROQ_COST_PER_M_TOKENS = 0.05;   // $0.05 per million tokens (llama-3.1-8b-instant)
const TTS_COST_PER_M_CHARS = 16.00;    // $16.00 per million characters (Google WaveNet/Neural2)

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function formatMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function calcCost(tokens: number, ttsChars: number): number {
  return (tokens / 1_000_000) * GROQ_COST_PER_M_TOKENS + (ttsChars / 1_000_000) * TTS_COST_PER_M_CHARS;
}

function sumLogs(logs: any[]): { tokens: number; tts_chars: number } {
  return {
    tokens: logs.reduce((s, l) => s + (l.tokens ?? 0), 0),
    tts_chars: logs.reduce((s, l) => s + (l.tts_chars ?? 0), 0),
  };
}

function buildChartUrl(
  label: string,
  labels: string[],
  data: number[],
  color: string,
  opts: { integer?: boolean; decimals?: number } = {},
): string {
  // QuickChart utilise Chart.js 2.x par défaut → syntaxe yAxes:[{ticks:{}}]
  // Les callbacks sont des fonctions JS littérales (évaluées par QuickChart)
  let ticksStr: string;
  if (opts.integer) {
    ticksStr = "{min:0,callback:function(v){return Number.isInteger(v)?v:null;}}";
  } else if (opts.decimals !== undefined) {
    ticksStr = `{min:0,callback:function(v){return v.toFixed(${opts.decimals});}}`;
  } else {
    ticksStr = "{min:0}";
  }

  const datasetJson = JSON.stringify({
    label,
    data,
    borderColor: color,
    backgroundColor: color + "22",
    borderWidth: 2,
    pointRadius: 4,
    pointBackgroundColor: color,
    fill: true,
    lineTension: 0.3,
  });

  const labelsJson = JSON.stringify(labels);

  // Syntaxe Chart.js 2.x : legend à la racine des options, yAxes tableau
  const configStr = `{type:"line",data:{labels:${labelsJson},datasets:[${datasetJson}]},options:{legend:{display:false},scales:{yAxes:[{ticks:${ticksStr}}]}}}`;

  return `https://quickchart.io/chart?w=700&h=220&bkg=white&c=${encodeURIComponent(configStr)}`;
}

function buildHTML(
  type: string,
  periodStart: Date,
  periodEnd: Date,
  yearStart: Date,
  users: any[],
  purchasesPeriod: any[],
  purchasesYear: any[],
  usagePeriod: { tokens: number; tts_chars: number },
  usageYear: { tokens: number; tts_chars: number },
  snapshots: any[],
): string {
  // Utilisateurs avec moins de 1 minute de crédit (< 60 secondes)
  const lowCreditsUsers = [...users]
    .filter(u => (u.credits_secondes ?? 0) < 60)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  const title = type === "monthly" ? "Rapport Mensuel" : "Rapport Bimensuel";
  const period = `${formatDate(periodStart)} → ${formatDate(periodEnd)}`;
  const periodLabel = `${formatDate(periodStart)} → ${formatDate(periodEnd)}`;
  const yearLabel = `01 janvier ${periodEnd.getFullYear()} → ${formatDate(periodEnd)}`;

  // Stats utilisateurs
  const totalUsers = users.length;
  const newUsersInPeriod = users.filter(u => u.created_at && new Date(u.created_at) >= periodStart);
  const newUsers = newUsersInPeriod.length;
  const activeUsers = users.filter(u => (u.stories_count ?? 0) > 0).length;
  const freeUsers = users.filter(u => !u.plan_type || u.plan_type === "free").length;
  const paidUsers = totalUsers - freeUsers;

  // Stats histoires
  const totalStories = users.reduce((s, u) => s + (u.stories_count ?? 0), 0);
  const totalSeconds = users.reduce((s, u) => s + (u.stories_total_seconds ?? 0), 0);
  const avgSecondsGlobal = totalStories > 0 ? Math.round(totalSeconds / totalStories) : 0;
  const totalCreditsRestants = users.reduce((s, u) => s + (u.credits_secondes ?? 0), 0);

  // Coûts IA all-time
  const allTimeTokens = users.reduce((s, u) => s + (u.tokens_total ?? 0), 0);
  const allTimeTtsChars = users.reduce((s, u) => s + (u.tts_chars_total ?? 0), 0);

  // Achats
  const totalAchatsPeriode = purchasesPeriod.length;
  const revenuePeriode = purchasesPeriod.reduce((s, p) => s + (Number(p.amount_usd) || 0), 0);
  const totalAchatsAnnee = purchasesYear.length;
  const revenueAnnee = purchasesYear.reduce((s, p) => s + (Number(p.amount_usd) || 0), 0);

  const achatParProduit: Record<string, { count: number; revenue: number }> = {};
  for (const p of purchasesPeriod) {
    if (!achatParProduit[p.product_id]) achatParProduit[p.product_id] = { count: 0, revenue: 0 };
    achatParProduit[p.product_id].count++;
    achatParProduit[p.product_id].revenue += Number(p.amount_usd) || 0;
  }

  const productsRows = Object.entries(achatParProduit).map(([prod, data]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${prod}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${data.count}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${data.revenue.toFixed(2)}</td>
    </tr>`).join("");

  const achatParUid: Record<string, number> = {};
  for (const p of purchasesPeriod) {
    if (p.uid) achatParUid[p.uid] = (achatParUid[p.uid] ?? 0) + (Number(p.amount_usd) || 0);
  }

  // Top 10
  const topUsers = [...users]
    .filter(u => (u.stories_count ?? 0) > 0)
    .sort((a, b) => (b.stories_count ?? 0) - (a.stories_count ?? 0))
    .slice(0, 10);

  const topUsersRows = topUsers.map(u => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${u.email ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${u.stories_count ?? 0}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${formatMinutes(u.stories_total_seconds ?? 0)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${formatMinutes(u.stories_avg_seconds ?? 0)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatMinutes(u.credits_secondes ?? 0)}</td>
    </tr>`).join("");


  // Tous les utilisateurs
  const allUsersRows = [...users]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .map(u => {
      const userCost = calcCost(u.tokens_total ?? 0, u.tts_chars_total ?? 0);
      const userRevenue = achatParUid[u.uid] ?? 0;
      const isNew = u.created_at && new Date(u.created_at) >= periodStart;
      return `
    <tr style="${isNew ? "background:#f0fff4;" : ""}">
      <td style="padding:7px 10px;border-bottom:1px solid #eee;font-size:12px;color:#999;">${u.user_number ?? "—"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;font-size:13px;">${u.email ?? "—"}${isNew ? "<br><span style='color:#2e7d32;font-size:10px;font-weight:bold;letter-spacing:0.5px;'>NEW</span>" : ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;color:#666;">${u.created_at ? formatDate(new Date(u.created_at)) : "—"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${u.plan_type ?? "free"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${u.stories_count ?? 0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${(u.tokens_total ?? 0).toLocaleString("fr-FR")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${(u.tts_chars_total ?? 0).toLocaleString("fr-FR")}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;color:#c62828;">$${userCost.toFixed(4)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${formatMinutes(u.credits_secondes ?? 0)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right;font-size:12px;color:${userRevenue > 0 ? "#2e7d32" : "#999"};">${userRevenue > 0 ? "$" + userRevenue.toFixed(2) : "—"}</td>
    </tr>`;
    }).join("");

  const iaCostRow = (label: string, tokens: number, ttsChars: number) => {
    const cost = calcCost(tokens, ttsChars);
    return `
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:13px;">${label}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${tokens.toLocaleString("fr-FR")}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${ttsChars.toLocaleString("fr-FR")}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:#c62828;font-weight:bold;">$${cost.toFixed(4)}</td>
    </tr>`;
  };

  // Graphes (dès le 1er snapshot)
  let chartsSection = "";
  if (snapshots.length >= 1) {
    const labels = snapshots.map(s => {
      try { return formatMonthLabel(new Date(s.sent_at)); } catch { return s.period_label ?? ""; }
    });

    const chartUsers = buildChartUrl("Utilisateurs", labels, snapshots.map(s => s.total_users), "#6750A4", { integer: true });
    const chartStories = buildChartUrl("Histoires", labels, snapshots.map(s => s.total_stories), "#1565c0", { integer: true });
    const chartRevenue = buildChartUrl("Revenus ($)", labels, snapshots.map(s => Number(s.revenue_period)), "#2e7d32", { decimals: 2 });
    const chartCost = buildChartUrl("Coût IA ($)", labels, snapshots.map(s => Number(s.ia_cost_period)), "#c62828", { decimals: 2 });

    chartsSection = `
    <!-- Graphes d'évolution -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">📈 Évolution</h2>

    <p style="color:#555;font-size:13px;margin:0 0 8px;">👥 Utilisateurs inscrits (cumulatif)</p>
    <img src="${chartUsers}" alt="Évolution utilisateurs" style="width:100%;border-radius:8px;border:1px solid #eee;" />

    <p style="color:#555;font-size:13px;margin:16px 0 8px;">📖 Histoires générées (cumulatif)</p>
    <img src="${chartStories}" alt="Évolution histoires" style="width:100%;border-radius:8px;border:1px solid #eee;" />

    <p style="color:#555;font-size:13px;margin:16px 0 8px;">💰 Revenus par période ($)</p>
    <img src="${chartRevenue}" alt="Évolution revenus" style="width:100%;border-radius:8px;border:1px solid #eee;" />

    <p style="color:#555;font-size:13px;margin:16px 0 8px;">🤖 Coût IA par période ($)</p>
    <img src="${chartCost}" alt="Évolution coût IA" style="width:100%;border-radius:8px;border:1px solid #eee;" />`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
<div style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

  <!-- Header -->
  <div style="background:#6750A4;padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">📊 HistoryVoice — ${title}</h1>
    <p style="color:#E8DEF8;margin:8px 0 0;">${period}</p>
    <p style="color:#E8DEF8;margin:4px 0 0;font-size:12px;">Généré le ${formatDate(new Date())}</p>
  </div>

  <div style="padding:24px;">

    <!-- Graphes -->
    ${chartsSection}

    <!-- Utilisateurs -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">👥 Utilisateurs</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f9f5ff;">
        <td style="padding:10px 12px;font-weight:bold;">Total inscrits</td>
        <td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:bold;color:#6750A4;">${totalUsers}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;">Nouveaux dans la période</td>
        <td style="padding:10px 12px;text-align:right;color:#2e7d32;font-weight:bold;">+${newUsers}</td>
      </tr>
      <tr style="background:#f9f5ff;">
        <td style="padding:10px 12px;">Utilisateurs actifs (≥1 histoire générée)</td>
        <td style="padding:10px 12px;text-align:right;">${activeUsers}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;">Plan gratuit / payant</td>
        <td style="padding:10px 12px;text-align:right;">${freeUsers} free / ${paidUsers} payant</td>
      </tr>
    </table>

    <!-- Histoires -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">📖 Histoires (cumulatif global)</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f9f5ff;">
        <td style="padding:10px 12px;font-weight:bold;">Total histoires générées</td>
        <td style="padding:10px 12px;text-align:right;font-size:20px;font-weight:bold;color:#6750A4;">${totalStories}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;">Total minutes générées</td>
        <td style="padding:10px 12px;text-align:right;">${formatMinutes(totalSeconds)}</td>
      </tr>
      <tr style="background:#f9f5ff;">
        <td style="padding:10px 12px;">Durée moyenne par histoire</td>
        <td style="padding:10px 12px;text-align:right;">${formatMinutes(avgSecondsGlobal)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;">Crédits restants (tous utilisateurs)</td>
        <td style="padding:10px 12px;text-align:right;">${formatMinutes(totalCreditsRestants)}</td>
      </tr>
    </table>

    <!-- Coûts IA -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">🤖 Coûts IA</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#6750A4;color:#fff;">
          <th style="padding:9px 12px;text-align:left;">Période</th>
          <th style="padding:9px 12px;text-align:center;">Tokens Groq</th>
          <th style="padding:9px 12px;text-align:center;">Chars TTS</th>
          <th style="padding:9px 12px;text-align:right;">Coût total</th>
        </tr>
      </thead>
      <tbody>
        ${iaCostRow(periodLabel, usagePeriod.tokens, usagePeriod.tts_chars)}
        ${iaCostRow(yearLabel, usageYear.tokens, usageYear.tts_chars)}
        ${iaCostRow("All-time", allTimeTokens, allTimeTtsChars)}
      </tbody>
    </table>

    <!-- Achats -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">💳 Achats</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#6750A4;color:#fff;">
          <th style="padding:9px 12px;text-align:left;">Période</th>
          <th style="padding:9px 12px;text-align:center;">Nb achats</th>
          <th style="padding:9px 12px;text-align:right;">Revenu</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:13px;">${periodLabel}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${totalAchatsPeriode}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:bold;color:#2e7d32;">$${revenuePeriode.toFixed(2)}</td>
        </tr>
        <tr style="background:#f9f5ff;">
          <td style="padding:9px 12px;border-bottom:1px solid #eee;font-size:13px;">${yearLabel}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${totalAchatsAnnee}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:bold;color:#2e7d32;">$${revenueAnnee.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    ${totalAchatsPeriode > 0 ? `
    <p style="color:#888;font-size:12px;margin-top:8px;">Détail des achats sur la période :</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#E8DEF8;">
          <th style="padding:8px 12px;text-align:left;color:#6750A4;">Produit</th>
          <th style="padding:8px 12px;text-align:center;color:#6750A4;">Qty</th>
          <th style="padding:8px 12px;text-align:right;color:#6750A4;">Revenu</th>
        </tr>
      </thead>
      <tbody>${productsRows}</tbody>
    </table>` : ""}

    <!-- Top 10 -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">🏆 Top 10 utilisateurs (all-time)</h2>
    ${topUsers.length === 0
      ? `<p style="color:#888;font-style:italic;">Aucune histoire générée pour l'instant.</p>`
      : `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#6750A4;color:#fff;">
          <th style="padding:8px 12px;text-align:left;">Email</th>
          <th style="padding:8px 12px;text-align:center;">Histoires</th>
          <th style="padding:8px 12px;text-align:center;">Total audio</th>
          <th style="padding:8px 12px;text-align:center;">Moyenne</th>
          <th style="padding:8px 12px;text-align:right;">Crédits restants</th>
        </tr>
      </thead>
      <tbody>${topUsersRows}</tbody>
    </table>`}

    <!-- Crédits faibles -->
    <h2 style="color:#e65100;border-bottom:2px solid #ffe0b2;padding-bottom:8px;margin-top:32px;">⚠️ Crédits faibles — moins de 1 min (${lowCreditsUsers.length})</h2>
    ${lowCreditsUsers.length === 0
      ? `<p style="color:#888;font-style:italic;">Aucun utilisateur avec moins de 1 minute de crédit.</p>`
      : `<p style="color:#888;font-size:12px;margin-top:-4px;">Ces utilisateurs ont épuisé leurs crédits d'essai sans recharger.</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#e65100;color:#fff;">
          <th style="padding:8px 12px;text-align:left;">#</th>
          <th style="padding:8px 12px;text-align:left;">Email</th>
          <th style="padding:8px 12px;text-align:center;">Inscription</th>
          <th style="padding:8px 12px;text-align:center;">Plan</th>
          <th style="padding:8px 12px;text-align:center;">Histoires</th>
          <th style="padding:8px 12px;text-align:right;">Crédits restants</th>
        </tr>
      </thead>
      <tbody>${lowCreditsUsers.map(u => `
        <tr>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;font-size:12px;color:#999;">${u.user_number ?? "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;font-size:13px;">${u.email ?? "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;color:#666;">${u.created_at ? formatDate(new Date(u.created_at)) : "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${u.plan_type ?? "free"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${u.stories_count ?? 0}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #eee;text-align:right;font-size:12px;color:#e65100;font-weight:bold;">${formatMinutes(u.credits_secondes ?? 0)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

    <!-- Nouveaux inscrits -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">🆕 Nouveaux inscrits dans la période (${newUsers})</h2>
    ${newUsers === 0
      ? `<p style="color:#888;font-style:italic;">Aucun nouvel inscrit sur cette période.</p>`
      : `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#6750A4;color:#fff;">
          <th style="padding:8px 12px;text-align:left;">#</th>
          <th style="padding:8px 12px;text-align:left;">Email</th>
          <th style="padding:8px 12px;text-align:center;">Inscription</th>
          <th style="padding:8px 12px;text-align:center;">Plan</th>
          <th style="padding:8px 12px;text-align:right;">Crédits</th>
        </tr>
      </thead>
      <tbody>${newUsersInPeriod
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(u => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#999;">${u.user_number ?? "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${u.email ?? "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${formatDate(new Date(u.created_at))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${u.plan_type ?? "free"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatMinutes(u.credits_secondes ?? 0)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

    <!-- Tous les utilisateurs -->
    <h2 style="color:#6750A4;border-bottom:2px solid #E8DEF8;padding-bottom:8px;margin-top:32px;">📋 Tous les utilisateurs (${totalUsers})</h2>
    <p style="color:#888;font-size:12px;margin-top:-4px;">Les lignes en vert sont les nouveaux inscrits de cette période. Coûts IA = all-time.</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#6750A4;color:#fff;font-size:12px;">
          <th style="padding:8px 10px;text-align:left;">#</th>
          <th style="padding:8px 10px;text-align:left;">Email</th>
          <th style="padding:8px 10px;text-align:center;">Inscription</th>
          <th style="padding:8px 10px;text-align:center;">Plan</th>
          <th style="padding:8px 10px;text-align:center;">Histoires</th>
          <th style="padding:8px 10px;text-align:center;">Tokens Groq</th>
          <th style="padding:8px 10px;text-align:center;">Chars TTS</th>
          <th style="padding:8px 10px;text-align:center;">Coût IA</th>
          <th style="padding:8px 10px;text-align:center;">Crédits</th>
          <th style="padding:8px 10px;text-align:right;">Achats période</th>
        </tr>
      </thead>
      <tbody>${allUsersRows}</tbody>
    </table>

  </div>

  <!-- Footer -->
  <div style="background:#f9f5ff;padding:16px;text-align:center;color:#888;font-size:12px;">
    HistoryVoice — Rapport automatique • Ne pas répondre à cet email
  </div>
</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const type = "monthly";

    const now = new Date();
    // Mois précédent complet (1er → dernier jour du mois précédent)
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // dernier jour du mois précédent

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Récupérer toutes les données en parallèle
    const [
      { data: users, error: usersError },
      { data: purchasesPeriod, error: purchasesPeriodError },
      { data: purchasesYear, error: purchasesYearError },
      { data: usageLogsPeriod, error: usagePeriodError },
      { data: usageLogsYear, error: usageYearError },
    ] = await Promise.all([
      supabase.from("users").select("uid, email, user_number, credits_secondes, plan_type, created_at, stories_count, stories_total_seconds, stories_avg_seconds, tokens_total, tts_chars_total"),
      supabase.from("purchases").select("*").gte("created_at", periodStart.toISOString()),
      supabase.from("purchases").select("*").gte("created_at", yearStart.toISOString()),
      supabase.from("usage_logs").select("tokens, tts_chars").gte("created_at", periodStart.toISOString()),
      supabase.from("usage_logs").select("tokens, tts_chars").gte("created_at", yearStart.toISOString()),
    ]);

    if (usersError) throw new Error(`Users query failed: ${usersError.message}`);
    if (purchasesPeriodError) throw new Error(`Purchases period query failed: ${purchasesPeriodError.message}`);
    if (purchasesYearError) throw new Error(`Purchases year query failed: ${purchasesYearError.message}`);
    if (usagePeriodError) throw new Error(`Usage period query failed: ${usagePeriodError.message}`);
    if (usageYearError) throw new Error(`Usage year query failed: ${usageYearError.message}`);

    const usagePeriod = sumLogs(usageLogsPeriod ?? []);
    const usageYear = sumLogs(usageLogsYear ?? []);

    const periodLabel = `${formatDate(periodStart)} → ${formatDate(periodEnd)}`;
    const totalUsers = (users ?? []).length;
    const activeUsers = (users ?? []).filter((u: any) => (u.stories_count ?? 0) > 0).length;
    const totalStories = (users ?? []).reduce((s: number, u: any) => s + (u.stories_count ?? 0), 0);
    const revenuePeriode = (purchasesPeriod ?? []).reduce((s: number, p: any) => s + (Number(p.amount_usd) || 0), 0);
    const iaCostPeriod = calcCost(usagePeriod.tokens, usagePeriod.tts_chars);

    // Sauvegarder le snapshot
    await supabase.from("report_snapshots").insert({
      report_type: type,
      period_label: periodLabel,
      total_users: totalUsers,
      active_users: activeUsers,
      total_stories: totalStories,
      revenue_period: revenuePeriode,
      ia_cost_period: iaCostPeriod,
    });

    // Récupérer l'historique des snapshots (incluant celui qu'on vient de créer)
    const { data: snapshots } = await supabase
      .from("report_snapshots")
      .select("*")
      .eq("report_type", type)
      .order("sent_at", { ascending: true })
      .limit(24);

    const html = buildHTML(
      type, periodStart, periodEnd, yearStart,
      users ?? [],
      purchasesPeriod ?? [],
      purchasesYear ?? [],
      usagePeriod,
      usageYear,
      snapshots ?? [],
    );

    const title = "Rapport Mensuel";
    const period = `${formatDate(periodStart)} → ${formatDate(periodEnd)}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "HistoryVoice Reports <historyvoice@belgacai.com>",
        to: [REPORT_TO],
        subject: `HistoryVoice — ${title} ${period}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      throw new Error(`Resend error: ${err}`);
    }

    console.log(`[send-report] ✅ ${title} envoyé à ${REPORT_TO}`);
    return new Response(JSON.stringify({ status: "sent", type, period }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-report] Error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
