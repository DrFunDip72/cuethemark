import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatPrecise, parseTime } from '@/lib/formatTime';
import type { Marker } from '@/lib/supabase';

const PREROLLS = [0, 1, 2, 3, 5];
const NUDGES = [-0.5, -0.1, 0.1, 0.5];

type MarkerEditDialogProps = {
  marker: Marker | null;
  onClose: () => void;
  onSave: (marker: Marker) => Promise<void>;
  onDelete: (marker: Marker) => Promise<void>;
};

export const MarkerEditDialog = ({ marker, onClose, onSave, onDelete }: MarkerEditDialogProps) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [preroll, setPreroll] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!marker) return;
    setName(marker.name);
    setTime(formatPrecise(marker.time_seconds));
    setPreroll(marker.preroll_seconds);
  }, [marker]);

  const parsedTime = parseTime(time);
  const valid = name.trim().length > 0 && parsedTime !== null;

  const nudge = (delta: number) => {
    const base = parsedTime ?? marker?.time_seconds ?? 0;
    setTime(formatPrecise(Math.max(0, Math.round((base + delta) * 10) / 10)));
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!marker} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit section</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!marker || !valid) return;
            run(() => onSave({ ...marker, name: name.trim(), time_seconds: parsedTime!, preroll_seconds: preroll }));
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="marker-name">Name</Label>
            <Input id="marker-name" value={name} maxLength={120} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Chorus, Lift, Counts 17–24" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marker-time">Starts at</Label>
            <div className="flex gap-2">
              <Input id="marker-time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28 font-mono" inputMode="decimal" />
              <div className="flex flex-1 gap-1">
                {NUDGES.map((d) => (
                  <Button key={d} type="button" variant="outline" size="sm" className="flex-1 px-0 font-mono text-xs" onClick={() => nudge(d)}>
                    {d > 0 ? '+' : ''}{d}
                  </Button>
                ))}
              </div>
            </div>
            {parsedTime === null && <p className="text-xs text-destructive">Use m:ss.s, e.g. 1:23.4</p>}
          </div>

          <div className="space-y-2">
            <Label>Count-in before the section</Label>
            <div className="flex gap-1" role="group">
              {PREROLLS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreroll(p)}
                  aria-pressed={preroll === p}
                  className={cn(
                    'h-9 flex-1 rounded-md border text-sm',
                    preroll === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p}s
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Playback starts this many seconds early so dancers can get set.</p>
          </div>

          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => marker && run(() => onDelete(marker))}>
              <Trash2 /> Delete
            </Button>
            <Button type="submit" disabled={!valid || busy}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
