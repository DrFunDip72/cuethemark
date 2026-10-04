import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, Music, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Routine } from '@/lib/supabase';
import { AUDIO_ACCEPT, createRoutineFromFile, validateAudio } from '@/lib/routines';
import { logEvent } from '@/lib/events';

type RoutineRow = Routine & { markers: { count: number }[] };

const RoutinesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: routines, isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('*, markers(count)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as RoutineRow[];
    },
  });

  const handleFile = async (file: File | undefined) => {
    if (!file || !user) return;
    const problem = validateAudio(file);
    if (problem) return toast.error(problem);

    setUploading(true);
    try {
      const routine = await createRoutineFromFile(user.id, file);
      logEvent('routine_created', routine.id);
      navigate(`/app/routines/${routine.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const uploadButton = (
    <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
      {uploading ? 'Uploading…' : 'New routine'}
    </Button>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Your routines</h1>
        {!!routines?.length && uploadButton}
      </div>
      <input ref={fileInput} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      {isLoading ? (
        <Spinner />
      ) : !routines?.length ? (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Set up your first routine</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><span className="font-semibold text-foreground">1. Upload</span> the rehearsal track (MP3, WAV, or M4A).</li>
            <li><span className="font-semibold text-foreground">2. Mark</span> each section while it plays — tap “Mark” at every count you want to drill.</li>
            <li><span className="font-semibold text-foreground">3. Share</span> one link or QR code. Dancers open it on their phones, no account needed.</li>
          </ol>
          <div className="mt-6">{uploadButton}</div>
        </div>
      ) : (
        <ul className="space-y-2">
          {routines.map((r) => {
            const count = r.markers[0]?.count ?? 0;
            return (
              <li key={r.id}>
                <Link
                  to={`/app/routines/${r.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition hover:border-primary/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Music className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} {count === 1 ? 'section' : 'sections'} · {r.sharing_enabled ? 'Shared' : 'Private'}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RoutinesPage;
