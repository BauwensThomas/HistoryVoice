// Edge Function: handle-payment
// Reçoit les webhooks RevenueCat et ajoute les crédits à l'utilisateur
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mapping produit → secondes de crédits
const PRODUCT_CREDITS: Record<string, number> = {
  starter_10min: 10 * 60,   // 600 secondes
  standard_25min: 25 * 60,  // 1500 secondes
  premium_60min: 60 * 60,   // 3600 secondes
};

// Mapping produit → jours de statut premium (zéro pub) accordés, cumulables
const PRODUCT_PREMIUM_DAYS: Record<string, number> = {
  starter_10min: 30,
  standard_25min: 60,
  premium_60min: 90,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Vérifier le secret webhook RevenueCat
    const authHeader = req.headers.get("authorization");
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      console.error("[handle-payment] Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const event = body.event;

    if (!event) {
      return new Response(
        JSON.stringify({ error: "No event in body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // RevenueCat envoie différents types d'événements
    // On ne traite que les achats confirmés
    const validTypes = [
      "INITIAL_PURCHASE",
      "NON_RENEWING_PURCHASE",
      "RENEWAL",
    ];

    if (!validTypes.includes(event.type)) {
      console.log(`[handle-payment] Event type ignoré: ${event.type}`);
      return new Response(
        JSON.stringify({ status: "ignored", type: event.type }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extraire les infos de l'achat
    const appUserId = event.app_user_id;
    const productId = event.product_id;

    if (!appUserId || !productId) {
      console.error("[handle-payment] Missing app_user_id or product_id");
      return new Response(
        JSON.stringify({ error: "Missing app_user_id or product_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Trouver les crédits à ajouter
    const creditsAAjouter = PRODUCT_CREDITS[productId];
    if (!creditsAAjouter) {
      console.error(`[handle-payment] Produit inconnu: ${productId}`);
      return new Response(
        JSON.stringify({ error: `Unknown product: ${productId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client Supabase avec service_role pour bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lire les crédits et le statut premium actuels de l'utilisateur
    const { data: userData, error: readError } = await supabase
      .from("users")
      .select("credits_secondes, email, premium_jusqua")
      .eq("uid", appUserId)
      .single();

    if (readError || !userData) {
      console.error("[handle-payment] User not found:", appUserId, readError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ajouter les crédits
    const nouveauSolde = (userData.credits_secondes ?? 0) + creditsAAjouter;

    // Prolonger le statut premium (zéro pub) : cumulable, à partir de la date
    // d'expiration actuelle si elle est dans le futur, sinon à partir de maintenant.
    const premiumDays = PRODUCT_PREMIUM_DAYS[productId] ?? 0;
    const base = userData.premium_jusqua && new Date(userData.premium_jusqua) > new Date()
      ? new Date(userData.premium_jusqua)
      : new Date();
    const nouveauPremiumJusqua = new Date(base.getTime() + premiumDays * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits_secondes: nouveauSolde,
        premium_jusqua: nouveauPremiumJusqua.toISOString(),
      })
      .eq("uid", appUserId);

    if (updateError) {
      console.error("[handle-payment] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Update failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Logger l'achat dans la table purchases
    await supabase.from("purchases").insert({
      uid: appUserId,
      email: userData.email ?? null,
      product_id: productId,
      credits_added: creditsAAjouter,
      amount_usd: event.price ?? null,
      currency: event.currency ?? "USD",
    });

    console.log(
      `[handle-payment] ✅ ${appUserId}: +${creditsAAjouter}s (${productId}) → ${nouveauSolde}s total, premium jusqu'au ${nouveauPremiumJusqua.toISOString()}`
    );

    return new Response(
      JSON.stringify({
        status: "success",
        credits_added: creditsAAjouter,
        new_balance: nouveauSolde,
        premium_jusqua: nouveauPremiumJusqua.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[handle-payment] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
