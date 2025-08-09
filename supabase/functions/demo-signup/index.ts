import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    // Service role client to use Admin API
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find existing user via pagination
    let existingUser: any | null = null;
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = data?.users ?? [];
      const found = users.find((u: any) => (u.email?.toLowerCase() ?? "") === email.toLowerCase());
      if (found) {
        existingUser = found;
        break;
      }

      if (users.length < perPage) break; // no more pages
      page += 1;
    }

    if (existingUser) {
      // Do NOT reset password. Inform client the account exists.
      return new Response(JSON.stringify({ alreadyExists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      return new Response(JSON.stringify({ alreadyExists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
