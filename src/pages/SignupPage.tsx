import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SignupPage() {
  const [search] = useSearchParams();
  const mode = search.get("mode");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign Up – MarkTapDance";
  }, []);

  const handlePaidSignup = async () => {
    if (!email || !password) {
      toast({ title: "Missing info", description: "Email and password are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;

      // If session exists, proceed to checkout. If not, ask for email confirmation
      if (data.session) {
        let checkoutUrl: string | null = null;
        if (promo) {
          const { data: validation } = await supabase.functions.invoke("validate-promo-code", {
            body: { code: promo, userId: data.session.user.id },
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
          if (validation?.valid && validation.promoCode?.id) {
            const { data: checkout } = await supabase.functions.invoke("create-checkout", {
              body: { promoCodeId: validation.promoCode.id },
              headers: { Authorization: `Bearer ${data.session.access_token}` },
            });
            checkoutUrl = checkout?.url ?? null;
          } else {
            toast({ title: "Invalid promo", description: validation?.error ?? "Promo code not valid", variant: "destructive" });
          }
        } else {
          const { data: checkout } = await supabase.functions.invoke("create-subscription-checkout", {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
          checkoutUrl = checkout?.url ?? null;
        }

        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
          toast({ title: "Almost there", description: "Complete payment in the new tab" });
        }
      } else {
        toast({ title: "Confirm your email", description: "Check your inbox, then log in to complete payment." });
      }
    } catch (e: any) {
      toast({ title: "Signup failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    if (!email) {
      toast({ title: "Missing email", description: "Email is required for the demo", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: demoResp, error: demoErr } = await supabase.functions.invoke("demo-signup", {
        body: { email },
      });
      if (demoErr) throw demoErr;
      const tempPassword = demoResp?.tempPassword as string;
      if (!tempPassword) throw new Error("Demo signup failed");

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });
      if (signInError) throw signInError;

      const token = signInData.session?.access_token;
      if (!token) throw new Error("Missing session after demo login");

      const { error: subErr } = await supabase.functions.invoke("create-demo-subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (subErr) throw subErr;

      toast({ title: "Demo activated", description: "You have 1 day of free access" });
      navigate("/app");
    } catch (e: any) {
      toast({ title: "Demo failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md animate-enter">
        <CardHeader className="text-center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Choose your path: paid or 1-day demo</CardDescription>
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
            <Label htmlFor="promo">Promo code (optional)</Label>
            <Input id="promo" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="e.g. LAUNCH" />
          </div>
          <div className="space-y-2">
            <Button className="w-full" disabled={loading} onClick={handlePaidSignup}>
              {loading ? "Processing..." : "Sign Up & Pay"}
            </Button>
            <Button className="w-full" variant="outline" disabled={loading} onClick={handleDemo}>
              {loading ? "Setting up demo..." : "Demo for a Day (Free)"}
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => navigate("/login")}>
              Already have an account? Log in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
