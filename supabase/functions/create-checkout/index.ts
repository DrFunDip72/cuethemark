import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { promoCodeId } = await req.json();
    if (!promoCodeId) throw new Error("Promo code ID is required");

    // Get promo code details
    const { data: promoCode, error: promoError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .eq("id", promoCodeId)
      .single();

    if (promoError || !promoCode) throw new Error("Invalid promo code");

    logStep("Promo code validated", { type: promoCode.type });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Handle different promo code types
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/`,
    };

    if (promoCode.type === "lifetime") {
      // Lifetime access - one-time payment of $0 or create directly
      sessionConfig = {
        ...sessionConfig,
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Lifetime Access" },
            unit_amount: 0,
          },
          quantity: 1,
        }],
      };
    } else if (promoCode.type === "demo") {
      // Demo access - 1 day trial
      sessionConfig = {
        ...sessionConfig,
        mode: "subscription",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Audio Labeling Tool" },
            unit_amount: 199, // $1.99
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        subscription_data: {
          trial_period_days: 1,
        },
      };
    } else if (promoCode.type === "monthly_free") {
      // 1 month free subscription
      sessionConfig = {
        ...sessionConfig,
        mode: "subscription",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Audio Labeling Tool" },
            unit_amount: 199, // $1.99
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        subscription_data: {
          trial_period_days: 30,
        },
      };
    }

    logStep("Creating Stripe checkout session", { type: promoCode.type });
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Record promo code usage
    await supabaseClient.from("promo_code_usage").insert({
      promo_code_id: promoCode.id,
      user_id: user.id,
    });

    // Update promo code usage count
    await supabaseClient
      .from("promo_codes")
      .update({ used_count: promoCode.used_count + 1 })
      .eq("id", promoCode.id);

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});