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
    document.title = "Login – MarkTapDance";
    const desc = "Log in to MarkTapDance to practice smarter and perform your best.";
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
      toast({ title: "Welcome back!" });
      navigate("/app");
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="sr-only">Login to MarkTapDance</h1>
      <div className="w-full max-w-md animate-enter">
        <div
          className="rounded-2xl p-[1.5px] shadow-xl"
          style={{
            backgroundImage:
              "linear-gradient(135deg, hsl(var(--gradient-hero-start)), hsl(var(--gradient-hero-mid)) 40%, hsl(var(--gradient-hero-end)))",
          }}
        >
          <Card className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/40">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">Welcome back</CardTitle>
              <CardDescription>
                Ready to level up your practice and perform with confidence?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
              </div>
              <div className="space-y-2">
                <Button className="w-full" disabled={loading} onClick={handleLogin}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
                <Button className="w-full" variant="ghost" onClick={() => navigate("/signup")}>Need an account? Sign up</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    </AuthLayout>
  );
}
