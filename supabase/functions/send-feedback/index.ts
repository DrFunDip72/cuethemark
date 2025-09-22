import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const escapeHtml = (value: unknown) => {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

interface FeedbackPayload {
  to: string;
  feedback: {
    user_id: string;
    user_email?: string | null;
    type: string;
    message: string;
    email?: string | null;
    current_route?: string | null;
    device_info?: Record<string, unknown> | null;
    app_version?: string | null;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, feedback } = (await req.json()) as FeedbackPayload;

    const sgKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sgKey) {
      console.error('SENDGRID_API_KEY missing');
      return new Response(JSON.stringify({ error: 'Missing email configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const subject = `New Feedback: ${feedback.type.toUpperCase()}`;
    const text = `New feedback submitted\n\n`+
      `Type: ${feedback.type}\n`+
      `Message: ${feedback.message}\n`+
      `From (optional): ${feedback.email ?? 'N/A'}\n`+
      `User email: ${feedback.user_email ?? 'N/A'}\n`+
      `User ID: ${feedback.user_id}\n`+
      `Route: ${feedback.current_route ?? 'N/A'}\n`+
      `App Version: ${feedback.app_version ?? 'N/A'}\n`+
      `Device: ${JSON.stringify(feedback.device_info ?? {}, null, 2)}\n`;

    const html = `
      <h2>New Feedback Submitted</h2>
      <p><strong>Type:</strong> ${escapeHtml(feedback.type)}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(feedback.message).replace(/\n/g, '<br/>')}</p>
      <p><strong>From (optional):</strong> ${escapeHtml(feedback.email ?? 'N/A')}</p>
      <p><strong>User email:</strong> ${escapeHtml(feedback.user_email ?? 'N/A')}</p>
      <p><strong>User ID:</strong> ${escapeHtml(feedback.user_id)}</p>
      <p><strong>Route:</strong> ${escapeHtml(feedback.current_route ?? 'N/A')}</p>
      <p><strong>App Version:</strong> ${escapeHtml(feedback.app_version ?? 'N/A')}</p>
      <pre style="background:#f6f6f6;padding:12px;border-radius:6px;">${escapeHtml(JSON.stringify(feedback.device_info ?? {}, null, 2))}</pre>
    `;

    const body = {
      personalizations: [ { to: [ { email: to } ] } ],
      from: { email: 'no-reply@cuethemark.app', name: 'CueTheMark' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
      reply_to: feedback.email ? { email: feedback.email } : undefined,
    } as Record<string, unknown>;

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sgKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('SendGrid error', res.status, errText);
      return new Response(JSON.stringify({ error: 'Email send failed', details: errText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    console.error('send-feedback error', e);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
