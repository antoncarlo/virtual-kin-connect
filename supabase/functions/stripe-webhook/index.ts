import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook signature
      event = JSON.parse(body);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (!metadata?.userId) {
          console.error("No userId in session metadata");
          break;
        }

        if (metadata.type === "subscription") {
          // Update user's subscription
          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_tier: metadata.planId,
              subscription_status: "active",
              stripe_customer_id: session.customer as string,
              trial_ends_at: null, // End trial when subscribed
            })
            .eq("user_id", metadata.userId);

          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log(`Subscription activated for user ${metadata.userId}: ${metadata.planId}`);
          }
        } else if (metadata.type === "tokens") {
          // Add tokens to user's balance
          const tokensAmount = parseInt(metadata.tokensAmount || "0");
          
          const { data, error } = await supabase.rpc("increment_tokens", {
            p_user_id: metadata.userId,
            p_amount: tokensAmount,
          });

          if (error) {
            console.error("Error adding tokens:", error);
          } else {
            console.log(`Added ${tokensAmount} tokens for user ${metadata.userId}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer id
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          const status = subscription.status === "active" ? "active" : subscription.status;
          await supabase
            .from("profiles")
            .update({ subscription_status: status })
            .eq("user_id", profile.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              subscription_status: "canceled",
            })
            .eq("user_id", profile.user_id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
