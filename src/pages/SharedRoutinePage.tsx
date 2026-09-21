import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PracticePlayer } from '@/components/PracticePlayer';
import { Spinner } from '@/components/Spinner';
import { Logo } from '@/components/Logo';
import { signedAudioUrl, supabase, toMarker, type SharedRoutine } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

const SharedRoutinePage = () => {
  const { shareId = '' } = useParams();

  // Refetches when the dancer comes back to the tab, so instructor edits show up without a new link.
  const { data: routine, isLoading } = useQuery({
    queryKey: ['shared', shareId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_routine', { p_share_id: shareId });
      if (error) throw error;
      if (!data) return null;
      const r = data as SharedRoutine;
      return { ...r, markers: r.markers.map(toMarker) };
    },
  });

  const { data: audioUrl = null } = useQuery({
    queryKey: ['shared-audio', routine?.audio_path],
    queryFn: () => signedAudioUrl(routine!.audio_path!),
    enabled: !!routine?.audio_path,
    staleTime: 1000 * 60 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (routine) {
      document.title = `${routine.title} · CueTheMark`;
      logEvent('shared_routine_opened', routine.id);
    }
    // Only log once per routine load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4">
        {isLoading ? (
          <Spinner fullScreen />
        ) : !routine ? (
          <div className="py-24 text-center">
            <h1 className="text-xl font-semibold">This practice link isn't active</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ask your instructor for a new link.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Practice track</p>
            <h1 className="mb-4 mt-1 text-2xl font-bold leading-tight">{routine.title}</h1>
            <PracticePlayer
              audioUrl={audioUrl}
              markers={routine.markers}
              storageKey={routine.id}
              onMarkerPlayed={() => logEvent('shared_marker_played', routine.id)}
              emptyMarkersMessage="Your instructor hasn't marked any sections yet. You can still play the full track."
            />
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Tap a section to jump there. Turn on <span className="font-medium text-foreground">Loop section</span> to drill it.
            </p>
          </>
        )}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-2 hover:text-foreground">
          <span className="scale-90"><Logo /></span> · Mark your own routines
        </Link>
      </footer>
    </div>
  );
};

export default SharedRoutinePage;
