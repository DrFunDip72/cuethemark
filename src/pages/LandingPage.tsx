import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Flag, Gauge, PlayCircle, Repeat, Share2, Smartphone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import WaveformVisual from '@/components/WaveformVisual';
import { useAuth } from '@/contexts/AuthContext';

const CONTACT_EMAIL = 'justinsmaxwell722@gmail.com';
const foundingMailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('CueTheMark founding studio')}`;

const steps = [
  { icon: Upload, title: 'Upload the track', desc: 'Drop in the MP3 you rehearse to.' },
  { icon: Flag, title: 'Mark it while it plays', desc: 'Tap once at every section. Name them later.' },
  { icon: Share2, title: 'Share one link', desc: 'Text it or post the QR code. Dancers just tap and practice.' },
];

const dancerFeatures = [
  { icon: Smartphone, title: 'No app, no account', desc: 'Opens instantly on any phone.' },
  { icon: Repeat, title: 'Loop any section', desc: 'Drill the hard eight counts, with a count-in.' },
  { icon: Gauge, title: 'Slow it down', desc: '0.5× to 1.1× without changing pitch.' },
];

const plans = [
  { name: 'Personal', price: 'Free', desc: 'Try it with your own routines.', features: ['Upload and mark tracks', 'Share links with your team'], cta: 'Start free', href: '/login' },
  { name: 'Coach', price: '$39', per: '/mo', desc: 'For independent instructors.', features: ['5 active shared routines', 'Unlimited dancers', 'Replace music without new links'], cta: 'Start free', href: '/login' },
  { name: 'Founding Studio', price: '$99', per: '/mo', desc: 'First 20 studios, price locked in.', features: ['Up to 5 instructors', '20 active shared routines', 'Unlimited dancers', 'Hands-on setup of your first routines'], cta: 'Become a founding studio', href: foundingMailto, featured: true },
];

export default function LandingPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'CueTheMark – Mark the routine once. Every dancer practices the right section.';
  }, []);

  const primaryCta = user ? (
    <Button asChild size="lg" className="rounded-full px-8 text-base">
      <Link to="/app">Go to your routines <ArrowRight /></Link>
    </Button>
  ) : (
    <Button asChild size="lg" className="rounded-full px-8 text-base">
      <Link to="/login">Mark your first routine <ArrowRight /></Link>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild size="sm" variant="ghost" className="hidden rounded-full sm:inline-flex"><Link to="/demo">Demo</Link></Button>
          <Button asChild size="sm" variant="ghost" className="hidden rounded-full sm:inline-flex"><a href="#pricing">Pricing</a></Button>
          {user ? (
            <Button asChild size="sm" className="rounded-full"><Link to="/app">Open app</Link></Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="rounded-full"><Link to="/login?mode=signin">Log in</Link></Button>
              <Button asChild size="sm" className="rounded-full"><Link to="/login">Start free</Link></Button>
            </>
          )}
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pb-32 md:pt-24">
        <div className="absolute inset-0 opacity-60"><WaveformVisual /></div>
        <div className="relative mx-auto max-w-3xl space-y-6 text-center animate-float-up">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">For dance instructors & teams</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Mark the routine once.<br />Every dancer practices the right section.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Upload your rehearsal music, tap to mark each section, and send your team one link. No more “start it at 1:42.”
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            {primaryCta}
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
              <Link to="/demo"><PlayCircle /> Try the live demo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">No account needed — a sample routine is already marked for you.</p>
        </div>
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Set up in under three minutes</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                <p className="text-xs font-semibold text-primary">STEP {i + 1}</p>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">What your dancers get</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {dancerFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Changed a marker or re-cut the music? Everyone with the link gets the update automatically.
          </p>
        </div>
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <blockquote className="text-2xl font-medium italic leading-relaxed md:text-3xl">
            “It has great value… to expedite the learning process.”
          </blockquote>
          <div>
            <p className="font-semibold">Elaine Grenko</p>
            <p className="text-sm text-muted-foreground">10-time US National Champion</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20" id="pricing">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Pay per studio, not per dancer</h2>
          <p className="mt-3 text-center text-muted-foreground">Dancers are always free. Instructors are free while we pilot.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl border p-6 ${p.featured ? 'border-primary/60 bg-primary/5' : 'border-border bg-card'}`}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  {p.per && <span className="text-muted-foreground">{p.per}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full rounded-full" variant={p.featured ? 'default' : 'outline'}>
                  {p.href.startsWith('mailto:') ? <a href={p.href}>{p.cta}</a> : <Link to={p.href}>{p.cta}</Link>}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <nav className="flex gap-6">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">Contact</a>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
          <p className="text-xs">© {new Date().getFullYear()} CueTheMark</p>
        </div>
      </footer>
    </div>
  );
}
