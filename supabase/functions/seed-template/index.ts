import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System template track to clone for each new user (independent of admin account)
const TEMPLATE_TRACK_ID = "00000000-0000-0000-0000-000000000001";

function log(step: string, details?: Record<string, unknown>) {
  console.log(`[SEED-TEMPLATE] ${step}${details ? " | " + JSON.stringify(details) : ""}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function start");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Service role client (needed to read template rows bypassing RLS)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      log("Auth error", { err: userErr?.message });
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    log("Authenticated", { userId: user.id, email: user.email });

    // Idempotency check
    const { data: alreadySeeded } = await admin
      .from("seeded_templates")
      .select("id")
      .eq("user_id", user.id)
      .eq("template_track_id", TEMPLATE_TRACK_ID)
      .maybeSingle();

    if (alreadySeeded) {
      log("Already seeded", { userId: user.id });
      return new Response(JSON.stringify({ status: "ok", alreadySeeded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch template track
    const { data: templateTrack, error: trackErr } = await admin
      .from("audio_tracks")
      .select("id, filename, url, notes")
      .eq("id", TEMPLATE_TRACK_ID)
      .maybeSingle();

    if (trackErr || !templateTrack) {
      log("Template track not found", { err: trackErr?.message });
      return new Response(JSON.stringify({ error: "Template track not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Create new track for user
    const { data: newTrackRows, error: insertTrackErr } = await admin
      .from("audio_tracks")
      .insert({
        user_id: user.id,
        filename: templateTrack.filename,
        url: templateTrack.url,
        notes: templateTrack.notes ?? "Starter track (cloned)",
      })
      .select("id")
      .limit(1);

    if (insertTrackErr || !newTrackRows || newTrackRows.length === 0) {
      log("Insert track failed", { err: insertTrackErr?.message });
      return new Response(JSON.stringify({ error: "Failed to create track" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const newTrackId = newTrackRows[0].id as string;
    log("Track created", { newTrackId });

    // Fetch template labels
    const { data: templateLabels, error: labelsErr } = await admin
      .from("audio_labels")
      .select("label_name, timestamp_seconds, playback_offset_seconds, order, notes")
      .eq("track_id", TEMPLATE_TRACK_ID)
      .order("order", { ascending: true });

    if (labelsErr) {
      log("Fetch labels failed", { err: labelsErr.message });
      // Proceed without labels (still mark seeded)
    } else if (templateLabels && templateLabels.length > 0) {
      const newLabels = templateLabels.map((l) => ({
        user_id: user.id,
        track_id: newTrackId,
        label_name: l.label_name,
        timestamp_seconds: l.timestamp_seconds,
        playback_offset_seconds: l.playback_offset_seconds,
        order: l.order,
        notes: l.notes,
      }));

      const { error: insertLabelsErr } = await admin
        .from("audio_labels")
        .insert(newLabels);

      if (insertLabelsErr) {
        log("Insert labels failed", { err: insertLabelsErr.message });
        // Continue; not fatal
      } else {
        log("Labels cloned", { count: newLabels.length });
      }
    }

    // Mark as seeded
    const { error: markErr } = await admin
      .from("seeded_templates")
      .insert({ user_id: user.id, template_track_id: TEMPLATE_TRACK_ID });

    if (markErr) {
      log("Mark seeded failed", { err: markErr.message });
      // Not fatal, but log
    }

    return new Response(JSON.stringify({ status: "ok", newTrackId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log("Unhandled error", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
