import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const [search] = useSearchParams();
  const mode = search.get("mode");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscription } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign Up – MarkTapDance";
    const desc = "Create your MarkTapDance account — start practicing smarter today.";
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
  }, []);

  const handleTrialSignup = async () => {
    if (!email || !password) {
      toast({ title: "Missing info", description: "Email and password are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/`,
          data: { referred_by: referredBy || null }
        },
      });
      if (error) throw error;

      // If session exists, create trial and redirect to app
      if (data.session) {
        const { error: trialError } = await supabase.functions.invoke("create-trial-subscription", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (trialError) throw trialError;

        await checkSubscription();
        toast({ title: "Welcome!", description: "Your 30-day free trial has started!" });
        navigate("/");
      } else {
        toast({ title: "Confirm your email", description: "Check your inbox, then log in to start your trial." });
      }
    } catch (e: any) {
      toast({ title: "Signup failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="sr-only">Create your MarkTapDance account</h1>
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
              <CardTitle>Join MarkTapDance</CardTitle>
              <CardDescription>
                Start your 30-day free trial and practice smarter today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
              </div>
              <div>
                <Label htmlFor="referredBy">Referred by (optional)</Label>
                <Input id="referredBy" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Name of person who referred you" />
              </div>
              <div className="space-y-2">
                <Button className="w-full" disabled={loading} onClick={handleTrialSignup}>
                  {loading ? "Starting trial..." : "Start 30-Day Free Trial"}
                </Button>
                <Button className="w-full" variant="ghost" onClick={() => navigate("/login")}>
                  Already have an account? Log in
                </Button>
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
