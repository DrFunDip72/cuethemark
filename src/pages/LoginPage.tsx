import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Login – CueTheMark";
    const desc = "Log in to CueTheMark to practice smarter and perform your best.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.href);
    const prefill = searchParams.get('email');
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Missing info", description: "Email and password are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Warm subscription status to avoid paywall flash
          supabase.functions
            .invoke('check-subscription', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            .catch(() => {});
        }
      } catch {}
      navigate("/app");
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="sr-only">Login to CueTheMark</h1>
      <div className="w-full max-w-md animate-enter">
        <Card
          className="rounded-2xl shadow-xl border-0"
          style={{
            backgroundColor: "hsl(var(--landing-surface))",
            border: "1px solid hsl(var(--landing-border))",
          }}
        >
          <CardHeader className="text-center">
            <CardTitle style={{ color: "hsl(var(--landing-text))" }}>Welcome back</CardTitle>
            <CardDescription style={{ color: "hsl(var(--landing-text-muted))" }}>
              Ready to level up your practice and perform with confidence?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" style={{ color: "hsl(var(--landing-text))" }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}
              />
            </div>
            <div>
              <Label htmlFor="password" style={{ color: "hsl(var(--landing-text))" }}>Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}
              />
            </div>
            <div className="space-y-2">
              <Button
                className="w-full rounded-full"
                style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
                disabled={loading}
                onClick={handleLogin}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
              <Button
                className="w-full rounded-full"
                variant="ghost"
                style={{ color: "hsl(var(--landing-text-muted))" }}
                onClick={() => navigate("/get-started")}
              >
                Need an account? Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            className="rounded-full"
            style={{ color: "hsl(var(--landing-text-muted))" }}
            onClick={() => navigate("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
