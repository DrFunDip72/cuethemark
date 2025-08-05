import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-PROMO] ${step}${detailsStr}`);
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

    const { code, userId } = await req.json();
    if (!code) throw new Error("Promo code is required");
    
    logStep("Validating promo code", { code, userId });

    // Check if promo code exists and is active
    const { data: promoCode, error: promoError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .single();

    if (promoError || !promoCode) {
      logStep("Promo code not found or inactive");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "Invalid or expired promo code" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      logStep("Promo code expired");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "This promo code has expired" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check usage limit
    if (promoCode.used_count >= promoCode.usage_limit) {
      logStep("Promo code usage limit reached");
      return new Response(JSON.stringify({ 
        valid: false, 
        error: "This promo code has reached its usage limit" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user already used this code
    if (userId) {
      const { data: usage } = await supabaseClient
        .from("promo_code_usage")
        .select("id")
        .eq("promo_code_id", promoCode.id)
        .eq("user_id", userId)
        .single();

      if (usage) {
        logStep("User already used this promo code");
        return new Response(JSON.stringify({ 
          valid: false, 
          error: "You have already used this promo code" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    logStep("Promo code is valid", { type: promoCode.type });

    return new Response(JSON.stringify({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        description: promoCode.description
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      valid: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});