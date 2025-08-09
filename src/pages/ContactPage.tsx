import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/lib/version";

export default function ContactPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const fromParam = params.get("from");

  const cameFrom = useMemo(() => {
    return fromParam || document.referrer || "/";
  }, [fromParam]);

  const deviceInfo = useMemo(() => {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const language = navigator.language || "";
    const vendor = navigator.vendor || "";

    const browser = /edg\//i.test(ua)
      ? "Edge"
      : /chrome|crios/i.test(ua)
      ? "Chrome"
      : /safari/i.test(ua)
      ? "Safari"
      : /firefox|fxios/i.test(ua)
      ? "Firefox"
      : /msie|trident/i.test(ua)
      ? "IE"
      : "Unknown";

    const os = /windows/i.test(ua)
      ? "Windows"
      : /mac os x/i.test(ua)
      ? "macOS"
      : /android/i.test(ua)
      ? "Android"
      : /ios|iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /linux/i.test(ua)
      ? "Linux"
      : "Unknown";

    return { browser, os, userAgent: ua, platform, language, vendor };
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

useEffect(() => {
    document.title = "Contact Us – MarkTapDance";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Contact MarkTapDance support. Send us a message and we'll get back to you shortly.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          to: "justinsmaxwell722@gmail.com",
          feedback: {
            user_id: user?.id ?? "anonymous",
            user_email: user?.email ?? null,
            type: "Contact",
            message,
            email,
            current_route: cameFrom,
            device_info: deviceInfo,
            app_version: APP_VERSION,
          },
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (_) {
      // Show a minimal inline error; keep UX simple
      alert("Sorry, we couldn't send your message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <main className="max-w-2xl mx-auto px-6 py-10">
          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-2">Thank you!</h1>
            <p className="text-muted-foreground mb-6">
              We've received your message and we'll get back to you shortly.
            </p>
            <div className="flex gap-3">
              {user ? (
                <Button onClick={() => navigate("/app/tracks")}>Back to App</Button>
              ) : (
                <Button variant="secondary" onClick={() => navigate("/")}>Return Home</Button>
              )}
            </div>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground mt-1">Have a question or feedback? Send us a message.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1">Name {user ? <span className="text-muted-foreground">(optional)</span> : null}</label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-destructive">*</span></label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
            />
          </div>

          {/* Hidden fields */}
          <input type="hidden" name="from" value={cameFrom} readOnly />
          <input type="hidden" name="device" value={JSON.stringify(deviceInfo)} readOnly />

          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

