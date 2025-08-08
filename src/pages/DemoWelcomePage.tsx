import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function DemoWelcomePage() {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    document.title = "Demo Activated – MarkTapDance";
    const desc = "Your demo is live! Explore MarkTapDance for a day and see the difference.";
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

    // Refresh subscription just in case
    checkSubscription();
  }, [checkSubscription]);

  return (
    <AuthLayout>
      <h1 className="sr-only">Demo Activated</h1>
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
              <CardTitle className="text-foreground">You’re in! Demo activated</CardTitle>
              <CardDescription>
                Take MarkTapDance for a spin — sharpen your practice and perform like a pro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate("/app")}>Explore the App</Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
