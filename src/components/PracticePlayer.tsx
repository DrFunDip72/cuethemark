import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Repeat, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatClock } from '@/lib/formatTime';
import type { Marker } from '@/lib/supabase';

const SPEEDS = [0.5, 0.75, 0.9, 1, 1.1];

type ToolbarContext = { currentTime: number; isPlaying: boolean };

type PracticePlayerProps = {
  audioUrl: string | null;
  markers: Marker[];
  /** Used to remember the dancer's speed per routine. */
  storageKey: string;
  onMarkerPlayed?: (marker: Marker) => void;
  /** Extra controls rendered under the transport (e.g. the instructor's "Mark" button). */
  toolbar?: (ctx: ToolbarContext) => React.ReactNode;
  /** Per-marker controls rendered at the end of each row (e.g. edit). */
  markerActions?: (marker: Marker) => React.ReactNode;
  emptyMarkersMessage?: React.ReactNode;
};

const sectionStart = (m: Marker) => Math.max(0, m.time_seconds - m.preroll_seconds);

export const PracticePlayer = ({
  audioUrl,
  markers,
  storageKey,
  onMarkerPlayed,
  toolbar,
  markerActions,
  emptyMarkersMessage,
}: PracticePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem(`ctm-speed-${storageKey}`)) || 1);
  const [loopSection, setLoopSection] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const sorted = useMemo(() => [...markers].sort((a, b) => a.time_seconds - b.time_seconds), [markers]);

  // The section being practiced: the last marker tapped, or whichever section the playhead is in.
  const currentIndex = useMemo(() => {
    let idx = -1;
    sorted.forEach((m, i) => {
      if (m.time_seconds <= currentTime + 0.05) idx = i;
    });
    return idx;
  }, [sorted, currentTime]);
  const activeIndex = activeMarkerId ? sorted.findIndex((m) => m.id === activeMarkerId) : currentIndex;
  const activeMarker = activeIndex >= 0 ? sorted[activeIndex] : null;
  const sectionEnd = activeIndex >= 0 && activeIndex < sorted.length - 1 ? sorted[activeIndex + 1].time_seconds : duration;

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    localStorage.setItem(`ctm-speed-${storageKey}`, String(speed));
  }, [speed, storageKey]);

  const play = useCallback(() => {
    audioRef.current?.play().catch((err) => console.warn('Playback failed', err));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  }, [play]);

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration || time));
    setCurrentTime(audio.currentTime);
  };

  const playMarker = (marker: Marker) => {
    setActiveMarkerId(marker.id);
    seek(sectionStart(marker));
    play();
    onMarkerPlayed?.(marker);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeMarker && sectionEnd > 0 && audio.currentTime >= sectionEnd) {
      if (loopSection) audio.currentTime = sectionStart(activeMarker);
      else if (activeMarkerId) setActiveMarkerId(null); // played past the tapped section; follow the playhead again
    }
    setCurrentTime(audio.currentTime);
  };

  const handleEnded = () => {
    if (loopSection && activeMarker) {
      seek(sectionStart(activeMarker));
      play();
    } else {
      setIsPlaying(false);
    }
  };

  // Space bar toggles playback on desktop (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code !== 'Space' || ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName) || target.isContentEditable) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const disabled = !audioUrl;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 pb-4 pt-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:bg-card sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={disabled}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {activeMarker ? activeMarker.name : 'Start'}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatClock(currentTime)} / {formatClock(duration)}
              </span>
            </div>
            <div className="relative py-2">
              <Slider
                value={[duration ? (currentTime / duration) * 1000 : 0]}
                max={1000}
                step={1}
                disabled={disabled}
                onValueChange={([v]) => {
                  setActiveMarkerId(null);
                  seek((v / 1000) * duration);
                }}
              />
              {duration > 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5">
                  {sorted.map((m) => (
                    <span
                      key={m.id}
                      className="absolute h-1.5 w-0.5 -translate-x-1/2 rounded bg-primary"
                      style={{ left: `${(m.time_seconds / duration) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => seek(currentTime - 5)}
            disabled={disabled}
            className="flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 5s
          </button>
          <button
            type="button"
            onClick={() => {
              // Pin the current section so pre-roll doesn't drift the loop back into the previous one.
              if (!loopSection && !activeMarkerId && activeMarker) setActiveMarkerId(activeMarker.id);
              setLoopSection((v) => !v);
            }}
            disabled={disabled || sorted.length === 0}
            aria-pressed={loopSection}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium disabled:opacity-40',
              loopSection ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Repeat className="h-3.5 w-3.5" /> Loop section
          </button>
          <div className="flex items-center rounded-full border border-border p-0.5" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={cn(
                  'h-8 rounded-full px-2.5 text-xs font-medium tabular-nums',
                  speed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {toolbar && <div className="mt-3">{toolbar({ currentTime, isPlaying })}</div>}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {emptyMarkersMessage ?? 'No sections marked yet.'}
        </div>
      ) : (
        <ol className="space-y-2">
          {sorted.map((m, i) => {
            const active = i === activeIndex;
            return (
              <li
                key={m.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border bg-card pr-2 transition',
                  active ? 'border-primary/60 bg-primary/10' : 'border-border',
                )}
              >
                <button
                  type="button"
                  onClick={() => playMarker(m)}
                  disabled={disabled}
                  className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left disabled:opacity-50"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{formatClock(m.time_seconds)}</span>
                </button>
                {markerActions?.(m)}
              </li>
            );
          })}
        </ol>
      )}

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="auto"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = speed;
          setDuration(e.currentTarget.duration || 0);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />
    </div>
  );
};
