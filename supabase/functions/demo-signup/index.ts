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
    if (!password || String(password).length < 6) {
      return new Response(JSON.stringify({ error: "Password (min 6 chars) is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
      // User already exists — don't change password; instruct client to go to login
      return new Response(JSON.stringify({ alreadyExists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new confirmed user with the provided password so they can log in immediately
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    return new Response(JSON.stringify({ created: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
