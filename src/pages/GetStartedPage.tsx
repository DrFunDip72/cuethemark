import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GetStartedPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Start Free Trial – CueTheMark";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Start your 30-day free trial with CueTheMark. No payment required. Then $1.99/month after your trial ends."
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
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;

      if (data.session) {
        // Create 30-day free trial
        const { error: trialError } = await supabase.functions.invoke('create-free-trial', {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (trialError) {
          console.error('Free trial creation error:', trialError);
          toast.error("Account created but free trial setup failed. Please contact support.");
        } else {
          toast.success("Welcome! Your 30-day free trial has started.");
          window.location.href = "/app";
        }
      } else {
        toast.success("Account created! Please check your email to confirm, then sign in to start your free trial.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />

      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-tight text-xl text-white">CueTheMark</Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="green" className="rounded-full">
            <Link to="/login">Log In</Link>
          </Button>
        </nav>
      </header>

      <main className="px-6 py-8 md:py-12 max-w-6xl mx-auto">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Practice smarter, not longer — set your marks and hit your cue every time.
            </h1>
            <p className="text-lg opacity-90">
              Start with a 30-day free trial. Then only $1.99/month.
            </p>
            <p className="text-sm opacity-80">
              No payment required to start. Cancel anytime.
            </p>
          </div>

          <Card className="backdrop-blur bg-white/80 dark:bg-black/40 shadow-lg">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Subscription is $1.99/month after your first month free. You’ll enter payment info & promo code on the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Start Free Trial"}
                </Button>
                <p className="text-xs opacity-80">
                  By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
