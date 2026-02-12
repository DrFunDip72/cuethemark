import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GetStartedPage() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [trialError, setTrialError] = useState(false);

  useEffect(() => {
    document.title = "Create Account – CueTheMark";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Create your CueTheMark account. Start your 14-day free trial today. No payment required upfront."
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    setTrialError(false);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: name,
            referred_by: referredBy || null
          },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;

      // Create 14-day trial subscription and redirect to app
      const { error: trialError } = await supabase.functions.invoke(
        "create-trial-subscription",
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`,
          },
        }
      );
      if (trialError) throw new Error(trialError.message || "Failed to create trial");

      toast.success("Welcome to CueTheMark! Your 14-day free trial has started.");
      const returnTo = searchParams.get("returnTo");
      const safeReturn = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/app/tracks";
      window.location.href = safeReturn;
    } catch (err: any) {
      console.error(err);
      
      // Provide better error messages for common scenarios
      let errorMessage = "Something went wrong. Please try again.";
      const isTrialFailure = err.message?.includes("Failed to create trial");
      
      if (isTrialFailure) {
        setTrialError(true);
      }
      
      if (err.message?.includes("already registered") || err.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Try logging in instead.";
      } else if (err.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message?.includes("Password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-tight text-xl" style={{ color: "hsl(var(--landing-text))" }}>CueTheMark</Link>
        <nav className="flex items-center gap-3">
          <Button asChild className="rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
            <Link to="/login">Log In</Link>
          </Button>
        </nav>
      </header>

      <main className="px-6 py-8 md:py-12 max-w-6xl mx-auto">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "hsl(var(--landing-text))" }}>
              Start your free trial
            </h1>
            <p className="text-lg" style={{ color: "hsl(var(--landing-text-muted))" }}>
              Start practicing better. Today.
            </p>
          </div>

          <Card
            className="shadow-lg border-0"
            style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}
          >
            <CardHeader>
              <CardTitle style={{ color: "hsl(var(--landing-text))" }}>Create your account</CardTitle>
              <CardDescription style={{ color: "hsl(var(--landing-text-muted))" }}>
                No payment required upfront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" style={{ color: "hsl(var(--landing-text))" }}>Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" style={{ color: "hsl(var(--landing-text))" }}>Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" style={{ color: "hsl(var(--landing-text))" }}>Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referredBy" style={{ color: "hsl(var(--landing-text))" }}>Referred by (optional)</Label>
                  <Input id="referredBy" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Name of person who referred you" style={{ backgroundColor: "hsl(var(--landing-bg))", borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }} />
                </div>
                <Button type="submit" className="w-full rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }} disabled={loading}>
                  {loading ? "Starting trial..." : "Start Free Trial"}
                </Button>
                {trialError && (
                  <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
                    Trial setup failed. Please try again or <Link to="/contact" className="underline font-medium" style={{ color: "hsl(var(--landing-accent))" }}>contact support</Link> if it persists.
                  </p>
                )}
                <p className="text-xs" style={{ color: "hsl(var(--landing-text-muted))" }}>
                  By continuing, you agree to our <Link to="/terms" className="underline" style={{ color: "hsl(var(--landing-accent))" }}>Terms</Link> and <Link to="/privacy" className="underline" style={{ color: "hsl(var(--landing-accent))" }}>Privacy Policy</Link>.
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}