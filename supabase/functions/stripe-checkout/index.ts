import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pricing configuration
const SUBSCRIPTION_PRICES = {
  essential: { priceId: null, amount: 2900, name: "Essential Plan" }, // $29/month
  premium: { priceId: null, amount: 4900, name: "Premium Plan" },     // $49/month
};

const TOKEN_PACKAGES = {
  tokens_5: { amount: 200, tokens: 5, name: "5 Tokens" },      // €2 = 5 tokens
  tokens_15: { amount: 500, tokens: 16, name: "15+1 Tokens" }, // €5 = 16 tokens (15+1 bonus)
  tokens_30: { amount: 1000, tokens: 32, name: "30+2 Tokens" }, // €10 = 32 tokens (30+2 bonus)
  tokens_60: { amount: 2000, tokens: 65, name: "60+5 Tokens" }, // €20 = 65 tokens (60+5 bonus)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const { type, planId, userId, email, successUrl, cancelUrl } = await req.json();

    if (!userId || !email) {
      throw new Error("userId and email are required");
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    let session;

    if (type === "subscription") {
      const plan = SUBSCRIPTION_PRICES[planId as keyof typeof SUBSCRIPTION_PRICES];
      if (!plan) {
        throw new Error(`Invalid plan: ${planId}`);
      }

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description: planId === "essential" 
                  ? "1 avatar, unlimited chat, voice calls up to 10min/day"
                  : "All avatars, unlimited chat, voice & video calls",
              },
              unit_amount: plan.amount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.headers.get("origin")}/dashboard?checkout=success`,
        cancel_url: cancelUrl || `${req.headers.get("origin")}/dashboard?checkout=canceled`,
        metadata: {
          userId,
          type: "subscription",
          planId,
        },
      });
    } else if (type === "tokens") {
      const tokenPkg = TOKEN_PACKAGES[planId as keyof typeof TOKEN_PACKAGES];
      if (!tokenPkg) {
        throw new Error(`Invalid token package: ${planId}`);
      }

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: tokenPkg.name,
                description: `${tokenPkg.tokens} call/video minutes`,
              },
              unit_amount: tokenPkg.amount,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.headers.get("origin")}/dashboard?tokens=success`,
        cancel_url: cancelUrl || `${req.headers.get("origin")}/dashboard?tokens=canceled`,
        metadata: {
          userId,
          type: "tokens",
          packageId: planId,
          tokensAmount: tokenPkg.tokens.toString(),
        },
      });
    } else {
      throw new Error("Invalid checkout type. Use 'subscription' or 'tokens'");
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
