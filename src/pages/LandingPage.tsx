import React, { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    document.title = "CueTheMark – Thank You";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "CueTheMark has shut down. Thank you for being part of our journey."
      );
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden text-[hsl(var(--hero-foreground))]">
      {/* Vibrant gradient backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))]" />

      <header className="max-w-6xl mx-auto px-6 py-6">
        <div></div>
      </header>

      <main className="px-6 py-8 md:py-12 max-w-6xl mx-auto min-h-[70vh] flex items-center justify-center">
        <section className="w-full text-center space-y-6 animate-enter">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">CueTheMark</h1>
          <p className="text-xl md:text-2xl opacity-90">Thank you for practicing with us.</p>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
            CueTheMark has officially shut down and is no longer available. We're grateful for everyone who was part of our journey.
          </p>
        </section>
      </main>
    </div>
  );
}
