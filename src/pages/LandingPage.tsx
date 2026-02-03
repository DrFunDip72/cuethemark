import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    document.title = "CueTheMark – Practice smarter, not longer — set your marks and hit your cue every time.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "CueTheMark: Practice smarter, not longer — set your marks and hit your cue every time. $6.99/month. Beta code BETA2025."
      );
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hero-foreground))]">
      {/* Vibrant gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />

      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        {/*<Link to="/" className="font-extrabold tracking-tight text-xl">CueTheMark</Link>*/}
        <div></div>
        <nav className="flex items-center gap-3">
          {user ? (
            <Button size="sm" className="rounded-full" onClick={() => navigate("/app/tracks")}>Go to App</Button>
          ) : (
            <>
              <Button asChild size="sm" variant="green" className="rounded-full"><Link to="/login">Log In</Link></Button>
            </>
          )}
        </nav>
      </header>

      <main className="px-6 py-8 md:py-12 max-w-6xl mx-auto min-h-[70vh] flex items-center justify-center">
        <section className="w-full text-center space-y-6 animate-enter">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">CueTheMark</h1>
          <p className="text-xl md:text-2xl opacity-90">Practice smarter, not longer — set your marks and hit your cue every time.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <Button size="lg" className="rounded-full" onClick={() => navigate("/app/tracks")}>Go to App</Button>
            ) : (
              <>
                <Button asChild size="lg" className="rounded-full"><Link to="/get-started">Get Started</Link></Button>
                <Button asChild size="lg" className="rounded-full" variant="green"><Link to="/login">Log In</Link></Button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
