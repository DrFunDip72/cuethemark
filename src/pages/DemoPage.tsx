import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flag, Pencil, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PracticePlayer } from '@/components/PracticePlayer';
import { MarkerEditDialog } from '@/components/MarkerEditDialog';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import type { Marker } from '@/lib/supabase';

const DEMO_AUDIO = '/demo/sample-routine.mp3';
const STORE_KEY = 'ctm-demo-markers';

/**
 * Seeded sections for the sample track. The times sit on the real 8-second
 * phrase boundaries in the recording, so the count-ins land musically.
 */
const SEED: Marker[] = [
  { id: 'seed-1', name: 'Intro', time_seconds: 0, preroll_seconds: 0 },
  { id: 'seed-2', name: 'Opening phrase', time_seconds: 8.45, preroll_seconds: 2 },
  { id: 'seed-3', name: 'Verse', time_seconds: 24.46, preroll_seconds: 2 },
  { id: 'seed-4', name: 'Build', time_seconds: 40.47, preroll_seconds: 2 },
  { id: 'seed-5', name: 'Break', time_seconds: 48.47, preroll_seconds: 2 },
  { id: 'seed-6', name: 'Finale', time_seconds: 64.48, preroll_seconds: 2 },
];

const loadMarkers = (): Marker[] => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as Marker[]) : SEED;
  } catch {
    return SEED;
  }
};

type View = 'instructor' | 'dancer';

export default function DemoPage() {
  const [markers, setMarkers] = useState<Marker[]>(loadMarkers);
  const [view, setView] = useState<View>('instructor');
  const [editing, setEditing] = useState<Marker | null>(null);

  useEffect(() => {
    document.title = 'Live demo · CueTheMark';
  }, []);

  // Edits belong to the visitor; they stay on this device and never hit an account.
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(markers));
  }, [markers]);

  const addMarker = (time: number) => {
    const marker: Marker = {
      id: crypto.randomUUID(),
      name: `Section ${markers.length + 1}`,
      time_seconds: Math.round(time * 100) / 100,
      preroll_seconds: 2,
    };
    setMarkers((prev) => [...prev, marker]);
    toast(`Marked ${marker.name}`, { action: { label: 'Rename', onClick: () => setEditing(marker) } });
  };

  const saveMarker = async (m: Marker) => setMarkers((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  const removeMarker = async (m: Marker) => setMarkers((prev) => prev.filter((x) => x.id !== m.id));

  const reset = () => {
    setMarkers(SEED);
    localStorage.removeItem(STORE_KEY);
    toast.success('Demo reset to the original sections.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <Link to="/"><Logo /></Link>
        <Button asChild size="sm" className="rounded-full">
          <Link to="/login">Start free</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20">
        <div className="mb-6 rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Live demo
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">A real routine, already marked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is the actual app running on a sample rehearsal track &mdash; no account, nothing to
            install. Play it, tap a section to jump, loop the hard part, or drop your own marker. Your
            changes stay on this device.
          </p>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <div className="flex flex-1 rounded-full border border-border p-1" role="group" aria-label="Point of view">
            {(['instructor', 'dancer'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  'h-9 flex-1 rounded-full text-xs font-semibold transition',
                  view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v === 'instructor' ? 'Instructor view' : 'Dancer view'}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="shrink-0 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {view === 'instructor' ? (
            <>
              You are the instructor: press play and <span className="font-medium text-foreground">mark a
              section</span> anywhere, or edit the ones already here.
            </>
          ) : (
            <>This is exactly what a dancer sees after you send the link &mdash; sections only, no way to change your marks.</>
          )}
        </p>

        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Practice track</p>
        <h2 className="mb-4 mt-1 text-xl font-bold leading-tight">Sample routine</h2>

        <PracticePlayer
          audioUrl={DEMO_AUDIO}
          markers={markers}
          storageKey="demo"
          toolbar={
            view === 'instructor'
              ? ({ currentTime }) => (
                  <Button size="lg" className="h-12 w-full text-base" onClick={() => addMarker(currentTime)}>
                    <Flag /> Mark section here
                  </Button>
                )
              : undefined
          }
          markerActions={
            view === 'instructor'
              ? (m) => (
                  <Button variant="ghost" size="icon" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)}>
                    <Pencil />
                  </Button>
                )
              : undefined
          }
          emptyMarkersMessage={
            view === 'instructor' ? (
              <>
                Press play, then tap <span className="font-semibold text-foreground">Mark section here</span> at
                the start of each part you want to drill.
              </>
            ) : (
              'Your instructor has not marked any sections yet. You can still play the full track.'
            )
          }
        />

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">What the demo leaves out</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            With an account you upload your own music, and every routine gets a share link and QR code you
            can text to the team. Re-cut the music or move a marker and everyone on the same link gets the
            update &mdash; no new link to send.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/login">Mark your own routine <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href="/#pricing">See pricing</a>
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Share2 className="h-3.5 w-3.5" /> Dancers never pay and never sign in.
          </p>
        </section>
      </main>

      <MarkerEditDialog marker={editing} onClose={() => setEditing(null)} onSave={saveMarker} onDelete={removeMarker} />
    </div>
  );
}
