import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import WaveformVisual from "@/components/WaveformVisual";
import { Clock, Zap, CalendarClock, Upload, MapPin, Share2, Target, Gauge, Users, CheckCircle2, ArrowRight, Play } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "CueTheMark – Master choreography faster.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "CueTheMark: The visual rehearsal engine built for elite performance teams. Reclaim 20% of rehearsal time. $6.99/month.");
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}>
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <span className="font-bold text-lg tracking-tight" style={{ color: "hsl(var(--landing-text))" }}>CueTheMark</span>
        <nav className="flex items-center gap-3">
          {user ? (
            <Button size="sm" className="rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }} onClick={() => navigate("/app/tracks")}>Go to App</Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="rounded-full" style={{ color: "hsl(var(--landing-text-muted))" }}><Link to="/login">Log In</Link></Button>
              <Button asChild size="sm" className="rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}><Link to="/get-started">Start Free Trial</Link></Button>
            </>
          )}
        </nav>
      </header>

      {/* 1. Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-28 md:pb-36">
        <div className="absolute inset-0 -z-0">
          <WaveformVisual />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 animate-float-up">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95]">
            Master choreography<br />faster.
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "hsl(var(--landing-text-muted))" }}>
            The visual rehearsal engine built for elite performance teams. Reclaim 20% of rehearsal time with precision markers and pitch-accurate tempo control.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            {user ? (
              <Button size="lg" className="rounded-full px-8 text-base font-semibold" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }} onClick={() => navigate("/app/tracks")}>
                Go to App <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="rounded-full px-8 text-base font-semibold" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
                  <Link to="/get-started">Start Your Free Trial <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-semibold" style={{ borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text-muted))", backgroundColor: "transparent" }}>
                  <Play className="mr-2 w-4 h-4" /> Watch 45-Second Demo
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="px-6 py-20 md:py-28" style={{ backgroundColor: "hsl(var(--landing-surface))" }}>
        <div className="max-w-5xl mx-auto text-center space-y-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--landing-accent))" }}>The Rehearsal Tax</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Is Your Music Holding You Back?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Clock, title: "The 20% Tax", desc: "Coaches and dancers lose 12 minutes of every hour scrubbing for timestamps." },
              { icon: Zap, title: "Momentum Killer", desc: "Linear music players weren't built for non-linear rehearsals." },
              { icon: CalendarClock, title: "Season Cost", desc: "That's 120+ hours per season lost to friction." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className={`p-6 rounded-xl animate-float-up animate-float-up-${i + 1}`} style={{ backgroundColor: "hsl(var(--landing-bg))", border: "1px solid hsl(var(--landing-border))" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.15)" }}>
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--landing-accent))" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p style={{ color: "hsl(var(--landing-text-muted))" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-5xl mx-auto text-center space-y-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--landing-accent))" }}>Simple Workflow</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Get Started in 3 Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, step: "01", title: "Upload your edited MP3", desc: "Drag and drop your team's audio file." },
              { icon: MapPin, step: "02", title: "Drop precision markers", desc: "Set markers on every 8-count in seconds." },
              { icon: Share2, step: "03", title: "Share with your team", desc: "Everyone gets the same marked-up track instantly." },
            ].map(({ icon: Icon, step, title, desc }, i) => (
              <div key={step} className={`relative text-center space-y-4 animate-float-up animate-float-up-${i + 1}`}>
                <div className="text-5xl font-black" style={{ color: "hsl(var(--landing-accent) / 0.15)" }}>{step}</div>
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--landing-accent))" }} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features */}
      <section className="px-6 py-20 md:py-28" style={{ backgroundColor: "hsl(var(--landing-surface))" }}>
        <div className="max-w-5xl mx-auto text-center space-y-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--landing-accent))" }}>Performance Multipliers</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Features That Move the Needle</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Target, title: "Precision Rehearsal", desc: "Clickable markers for every sequence. Jump instantly to any 8-count.", highlight: false },
              { icon: Gauge, title: "Technical Mode", desc: "Slow to 80% speed without pitch distortion for clean, controlled reps.", highlight: false },
              { icon: Users, title: "Team Sync", desc: "Update once. Every dancer's track syncs automatically.", highlight: true },
            ].map(({ icon: Icon, title, desc, highlight }, i) => (
              <div
                key={title}
                className={`p-6 rounded-xl transition-all animate-float-up animate-float-up-${i + 1}`}
                style={{
                  backgroundColor: highlight ? "hsl(var(--landing-accent) / 0.08)" : "hsl(var(--landing-bg))",
                  border: highlight ? "1px solid hsl(var(--landing-accent) / 0.4)" : "1px solid hsl(var(--landing-border))",
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.15)" }}>
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--landing-accent))" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p style={{ color: "hsl(var(--landing-text-muted))" }}>{desc}</p>
                {highlight && (
                  <span className="inline-block mt-3 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.2)", color: "hsl(var(--landing-accent))" }}>
                    Viral Loop
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Differentiation */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Built for Non-Linear Rehearsal.</h2>
          <p className="text-lg" style={{ color: "hsl(var(--landing-text-muted))" }}>
            Unlike Spotify or standard music players, CueTheMark is engineered for competitive rehearsal workflows — not passive listening.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-6 text-sm">
            <div className="rounded-lg p-4 text-left space-y-2" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
              <p className="font-semibold" style={{ color: "hsl(var(--landing-text-muted))" }}>Music Players</p>
              <ul className="space-y-1" style={{ color: "hsl(var(--landing-text-muted))" }}>
                <li>✗ Linear playback</li>
                <li>✗ No markers</li>
                <li>✗ No team sync</li>
              </ul>
            </div>
            <div className="rounded-lg p-4 text-left space-y-2" style={{ border: "1px solid hsl(var(--landing-accent) / 0.4)", backgroundColor: "hsl(var(--landing-accent) / 0.05)" }}>
              <p className="font-semibold" style={{ color: "hsl(var(--landing-accent))" }}>CueTheMark</p>
              <ul className="space-y-1">
                <li>✓ Jump-to-section</li>
                <li>✓ Precision markers</li>
                <li>✓ Real-time sync</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Social Proof */}
      <section className="px-6 py-20 md:py-28" style={{ backgroundColor: "hsl(var(--landing-surface))" }}>
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--landing-accent))" }}>Social Proof</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Endorsed by National Champions.</h2>
          <blockquote className="text-2xl md:text-3xl font-medium italic leading-relaxed" style={{ color: "hsl(var(--landing-text))" }}>
            "It has great value… to expedite the learning process."
          </blockquote>
          <div>
            <p className="font-semibold">Elaine Grenko</p>
            <p className="text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>10-time US National Champion</p>
          </div>
          <div className="inline-block text-xs font-medium px-4 py-2 rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.1)", color: "hsl(var(--landing-accent))", border: "1px solid hsl(var(--landing-accent) / 0.25)" }}>
            Official Pilot Partner: Timpview High School Ballroom
          </div>
        </div>
      </section>

      {/* 7. Pricing */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center space-y-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--landing-accent))" }}>Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Individual */}
            <div className="rounded-xl p-8 text-left space-y-4" style={{ backgroundColor: "hsl(var(--landing-surface))", border: "1px solid hsl(var(--landing-border))" }}>
              <h3 className="text-lg font-semibold">Individual Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$6.99</span>
                <span style={{ color: "hsl(var(--landing-text-muted))" }}>/mo</span>
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>For dedicated dancers mastering solo or assigned parts.</p>
              <ul className="space-y-2 text-sm pt-2">
                {["Unlimited MP3 uploads", "Precision markers", "Tempo control", "14-day free trial"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--landing-accent))" }} />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full rounded-full mt-4" variant="outline" style={{ borderColor: "hsl(var(--landing-border))", color: "hsl(var(--landing-text))" }}>
                <Link to="/get-started">Get Started</Link>
              </Button>
            </div>
            {/* Studio */}
            <div className="relative rounded-xl p-8 text-left space-y-4" style={{ border: "1px solid hsl(var(--landing-accent) / 0.5)", backgroundColor: "hsl(var(--landing-accent) / 0.06)" }}>
              <span className="absolute -top-3 left-8 text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>Most Popular</span>
              <h3 className="text-lg font-semibold">Studio License</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$49.99</span>
                <span style={{ color: "hsl(var(--landing-text-muted))" }}>/mo</span>
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>Shared routines, team sync, unlimited markers.</p>
              <ul className="space-y-2 text-sm pt-2">
                {["Everything in Individual", "Shared team routines", "Automatic team sync", "Unlimited markers", "14-day free trial"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--landing-accent))" }} />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full rounded-full mt-4" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
                <Link to="/get-started">Start Free Trial</Link>
              </Button>
            </div>
          </div>
          <p className="text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>14-day free trial · Cancel anytime · No credit card required</p>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="px-6 py-20 md:py-28" style={{ backgroundColor: "hsl(var(--landing-surface))" }}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to reclaim your rehearsal?</h2>
          <Button asChild size="lg" className="rounded-full px-10 text-base font-semibold" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
            <Link to="/get-started">Start Your Free Trial <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="px-6 py-12" style={{ borderTop: "1px solid hsl(var(--landing-border))" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-bold tracking-tight" style={{ color: "hsl(var(--landing-text-muted))" }}>CueTheMark</span>
          <nav className="flex gap-6 text-sm" style={{ color: "hsl(var(--landing-text-muted))" }}>
            <Link to="/contact" className="hover:underline">Support</Link>
            <Link to="/contact" className="hover:underline">FAQ</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
          </nav>
          <p className="text-xs" style={{ color: "hsl(var(--landing-text-muted))" }}>© {new Date().getFullYear()} CueTheMark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
