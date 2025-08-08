import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "MarkTapDance – Practice smarter, hit your cue";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "MarkTapDance: Mark. Tap. Dance. Practice smarter, not longer — set your marks and hit your cue every time."
      );
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-enter" />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-3xl animate-enter" />
        <div className="absolute bottom-[-6rem] left-1/4 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl animate-enter" />
      </div>

      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="text-lg font-semibold tracking-tight">MarkTapDance</Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
          <Button onClick={() => navigate("/signup")}>Sign Up & Pay</Button>
        </div>
      </header>

      <main className="px-6 pb-16 pt-10 md:pt-20 max-w-6xl mx-auto">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Mark. Tap. Dance.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Practice smarter, not longer — set your marks and hit your cue every time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate("/signup?mode=demo")}>Demo for a Day (Free)</Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/signup")}>Sign Up & Pay</Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>Login</Button>
            </div>
          </div>

          {/* Simple phone mock with floating pulse */}
          <div className="relative h-[380px] md:h-[460px] animate-scale-in">
            <div className="absolute inset-0 rounded-3xl bg-card shadow-lg border flex items-center justify-center">
              <div className="p-6 text-center">
                <div className="text-2xl font-semibold mb-2">MarkTapDance</div>
                <div className="text-muted-foreground">Set markers. Tap cues. Nail performances.</div>
                <div className="mt-6 h-40 rounded-xl bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15" />
              </div>
            </div>
            <div className="absolute -inset-6 rounded-[2rem] border border-primary/20 animate-pulse" />
          </div>
        </section>
      </main>
    </div>
  );
}
