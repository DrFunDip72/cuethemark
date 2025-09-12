import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-AUDIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Admin security audit started");

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
    if (!user?.email) throw new Error("User not authenticated");

    // Check if current user is admin
    const { data: currentUserProfile, error: currentUserError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (currentUserError || !currentUserProfile?.is_admin) {
      throw new Error("Only admin users can access security audit");
    }

    logStep("Admin user verified", { userId: user.id });

    // Get admin activity overview
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from('profiles')
      .select('user_id, email, created_at, updated_at')
      .eq('is_admin', true);

    if (adminError) {
      throw new Error(`Failed to fetch admin users: ${adminError.message}`);
    }

    // Get recent admin activities (could be expanded)
    const auditData = {
      admin_count: adminUsers?.length || 0,
      admin_users: adminUsers,
      audit_timestamp: new Date().toISOString(),
      security_checks: {
        multiple_admins: (adminUsers?.length || 0) > 1,
        admin_emails_secure: adminUsers?.every(admin => 
          admin.email && admin.email.includes('@')
        ) || false
      }
    };

    logStep("Security audit completed", auditData);

    return new Response(JSON.stringify(auditData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin security audit", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});