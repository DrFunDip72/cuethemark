import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hero-foreground))]">
      {/* Vibrant gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />

      <main className="px-6 py-8 md:py-12 max-w-6xl mx-auto min-h-screen flex items-center justify-center">
        <section className="w-full text-center space-y-6 animate-enter">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">MarkTapDance</h1>
          <p className="text-xl md:text-2xl italic/relaxed opacity-90">Mark. Tap. Dance.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <Button size="lg" className="rounded-full" onClick={() => navigate("/app/tracks")}>Go to App</Button>
            ) : (
              <>
                <Button size="lg" className="rounded-full" variant="secondary" onClick={() => navigate("/signup?mode=demo")}>Demo for a Day (Free)</Button>
                <Button size="lg" className="rounded-full" variant="green" onClick={() => navigate("/signup")}>Sign Up & Pay</Button>
                <Button size="lg" className="rounded-full" variant="purple" onClick={() => navigate("/login")}>Login</Button>
              </>
            )}
          </div>

          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Practice smarter, not longer — set your marks and hit your cue every time.
          </p>
        </section>
      </main>
      <footer className="relative z-10">
        <div className="border-t border-border" />
        <div className="max-w-6xl mx-auto px-6 py-6">
          <nav className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <Link to="/contact?from=/" className="hover:underline">Contact Us</Link>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </nav>
          <p className="mt-4 text-center text-sm text-white">© 2025 MarkTapDance</p>
        </div>
        <div className="border-t border-border" />
      </footer>
    </div>
  );
}
