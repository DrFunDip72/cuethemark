import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking existing subscription");
      
      // Check existing subscription record first (including demo subscriptions)
      const { data: existingSubscription } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      let expiredDemoEnd: string | null = null;
      if (existingSubscription) {
        logStep("Found existing subscription record", existingSubscription);
        
        // Check for valid Trial subscription
        if (existingSubscription.subscription_tier === "Trial" && existingSubscription.subscription_end) {
          const endDate = new Date(existingSubscription.subscription_end);
          const now = new Date();
          if (endDate > now) {
            logStep("Found valid trial subscription");
            return new Response(JSON.stringify({
              subscribed: true,
              subscription_tier: "Trial",
              subscription_end: existingSubscription.subscription_end
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          } else {
            logStep("Trial subscription expired");
            expiredDemoEnd = existingSubscription.subscription_end;
          }
        }
        
        // Check for valid Demo subscription
        if (existingSubscription.subscription_tier === "Demo" && existingSubscription.subscription_end) {
          const endDate = new Date(existingSubscription.subscription_end);
          const now = new Date();
          if (endDate > now) {
            logStep("Found valid demo subscription");
            return new Response(JSON.stringify({
              subscribed: true,
              subscription_tier: "Demo",
              subscription_end: existingSubscription.subscription_end
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          } else {
            logStep("Demo subscription expired");
            expiredDemoEnd = existingSubscription.subscription_end;
          }
        }
      }
      
      // Check for lifetime access from promo codes
      const { data: lifetimeUsage } = await supabaseClient
        .from("promo_code_usage")
        .select(`
          promo_codes!inner(type)
        `)
        .eq("user_id", user.id)
        .eq("promo_codes.type", "lifetime")
        .single();

      const hasLifetimeAccess = !!lifetimeUsage;
      
      if (hasLifetimeAccess) {
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: true,
          subscription_tier: "lifetime",
          subscription_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        return new Response(JSON.stringify({ 
          subscribed: true,
          subscription_tier: "lifetime",
          subscription_end: null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // If demo expired and no lifetime, persist the expired demo state
      if (expiredDemoEnd) {
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: "Demo",
          subscription_end: expiredDemoEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        return new Response(JSON.stringify({ 
          subscribed: false,
          subscription_tier: "Demo",
          subscription_end: expiredDemoEnd
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Default: no subscription
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({ 
        subscribed: false,
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    const activeOrTrial = subs.data.find((s) => s.status === "active" || s.status === "trialing");
    const hasActiveOrTrial = !!activeOrTrial;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveOrTrial) {
      const subscription = activeOrTrial;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionTier = "monthly"; // Treat trialing as active monthly for gating
      logStep("Active or trialing subscription found", { subscriptionId: subscription.id, status: subscription.status, endDate: subscriptionEnd });
    } else {
      // Check for lifetime access
      const { data: lifetimeUsage } = await supabaseClient
        .from("promo_code_usage")
        .select(`
          promo_codes!inner(type)
        `)
        .eq("user_id", user.id)
        .eq("promo_codes.type", "lifetime")
        .single();

      if (lifetimeUsage) {
        subscriptionTier = "lifetime";
        logStep("Found lifetime access");
      }
    }

    const isSubscribed = hasActiveOrTrial || subscriptionTier === "lifetime";

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: isSubscribed,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: isSubscribed, subscriptionTier });

    return new Response(JSON.stringify({
      subscribed: isSubscribed,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
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