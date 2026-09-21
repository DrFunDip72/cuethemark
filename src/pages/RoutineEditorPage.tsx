import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Flag, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PracticePlayer } from '@/components/PracticePlayer';
import { MarkerEditDialog } from '@/components/MarkerEditDialog';
import { SharePanel } from '@/components/SharePanel';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { signedAudioUrl, supabase, toMarker, type Marker, type Routine } from '@/lib/supabase';
import { AUDIO_ACCEPT, deleteRoutine, newShareId, replaceRoutineAudio, validateAudio } from '@/lib/routines';
import { logEvent } from '@/lib/events';

const RoutineEditorPage = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const replaceInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Marker | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [replacing, setReplacing] = useState(false);

  const routineQuery = useQuery({
    queryKey: ['routine', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('routines').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Routine;
    },
  });
  const routine = routineQuery.data;

  const markersKey = ['markers', id];
  const { data: markers = [] } = useQuery({
    queryKey: markersKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('markers').select('id, name, time_seconds, preroll_seconds').eq('routine_id', id).order('time_seconds');
      if (error) throw error;
      return data.map(toMarker);
    },
  });

  const { data: audioUrl = null } = useQuery({
    queryKey: ['audio-url', routine?.audio_path],
    queryFn: () => signedAudioUrl(routine!.audio_path!),
    enabled: !!routine?.audio_path,
    staleTime: 1000 * 60 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const updateRoutine = async (patch: Partial<Routine>) => {
    const { data, error } = await supabase.from('routines').update(patch).eq('id', id).select().single();
    if (error) {
      toast.error('Could not save. Try again.');
      throw error;
    }
    queryClient.setQueryData(['routine', id], data);
    queryClient.invalidateQueries({ queryKey: ['routines'] });
  };

  const addMarker = async (time: number) => {
    const name = `Section ${markers.length + 1}`;
    const { data, error } = await supabase
      .from('markers')
      .insert({ routine_id: id, name, time_seconds: Math.round(time * 100) / 100 })
      .select('id, name, time_seconds, preroll_seconds')
      .single();
    if (error) return toast.error('Could not add the marker.');
    const marker = toMarker(data);
    queryClient.setQueryData<Marker[]>(markersKey, (prev = []) => [...prev, marker]);
    queryClient.invalidateQueries({ queryKey: ['routines'] });
    logEvent('marker_created', id);
    toast(`Marked “${name}”`, { action: { label: 'Rename', onClick: () => setEditing(marker) } });
  };

  const saveMarker = async (m: Marker) => {
    const { error } = await supabase
      .from('markers')
      .update({ name: m.name, time_seconds: m.time_seconds, preroll_seconds: m.preroll_seconds })
      .eq('id', m.id);
    if (error) {
      toast.error('Could not save the section.');
      throw error;
    }
    queryClient.setQueryData<Marker[]>(markersKey, (prev = []) => prev.map((x) => (x.id === m.id ? m : x)));
  };

  const removeMarker = async (m: Marker) => {
    const { error } = await supabase.from('markers').delete().eq('id', m.id);
    if (error) {
      toast.error('Could not delete the section.');
      throw error;
    }
    queryClient.setQueryData<Marker[]>(markersKey, (prev = []) => prev.filter((x) => x.id !== m.id));
    queryClient.invalidateQueries({ queryKey: ['routines'] });
  };

  const handleReplace = async (file: File | undefined) => {
    if (!file || !user || !routine) return;
    const problem = validateAudio(file);
    if (problem) return toast.error(problem);
    setReplacing(true);
    try {
      await replaceRoutineAudio(user.id, routine, file);
      await routineQuery.refetch();
      toast.success('Audio replaced. Your sections and share link are unchanged.');
    } catch (err) {
      console.error(err);
      toast.error('Could not replace the audio.');
    } finally {
      setReplacing(false);
      if (replaceInput.current) replaceInput.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!routine || !confirm(`Delete “${routine.title}”? Dancers will lose access and this can't be undone.`)) return;
    try {
      await deleteRoutine(routine);
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      navigate('/app');
    } catch {
      toast.error('Could not delete the routine.');
    }
  };

  if (routineQuery.isLoading) return <Spinner />;
  if (!routine) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Routine not found.</p>
        <Link to="/app" className="mt-4 inline-block text-primary underline">Back to your routines</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Routines
        </Link>
        {editingTitle ? (
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim()) return;
              await updateRoutine({ title: title.trim() });
              setEditingTitle(false);
            }}
          >
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoFocus className="text-lg font-semibold" />
            <Button type="submit">Save</Button>
            <Button type="button" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
          </form>
        ) : (
          <button
            type="button"
            className="group flex items-start gap-2 text-left"
            onClick={() => {
              setTitle(routine.title);
              setEditingTitle(true);
            }}
          >
            <h1 className="text-2xl font-bold leading-tight">{routine.title}</h1>
            <Pencil className="mt-2 h-4 w-4 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
          </button>
        )}
      </div>

      <PracticePlayer
        audioUrl={audioUrl}
        markers={markers}
        storageKey={routine.id}
        onMarkerPlayed={() => logEvent('marker_played', routine.id)}
        toolbar={({ currentTime }) => (
          <Button size="lg" className="h-12 w-full text-base" disabled={!audioUrl} onClick={() => addMarker(currentTime)}>
            <Flag /> Mark section here
          </Button>
        )}
        markerActions={(m) => (
          <Button variant="ghost" size="icon" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)}>
            <Pencil />
          </Button>
        )}
        emptyMarkersMessage={
          <>Press play, then tap <span className="font-semibold text-foreground">Mark section here</span> at the start of each part you want to drill.</>
        }
      />

      <SharePanel
        routine={routine}
        onToggleSharing={(enabled) => updateRoutine({ sharing_enabled: enabled })}
        onResetLink={() => updateRoutine({ share_id: newShareId() })}
      />

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Routine settings</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => replaceInput.current?.click()} disabled={replacing}>
            {replacing ? <Loader2 className="animate-spin" /> : <Upload />} Replace audio
          </Button>
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 /> Delete routine
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Replacing the audio keeps your sections and the same share link — handy when the music gets re-cut.</p>
        <input ref={replaceInput} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={(e) => handleReplace(e.target.files?.[0])} />
      </section>

      <MarkerEditDialog marker={editing} onClose={() => setEditing(null)} onSave={saveMarker} onDelete={removeMarker} />
    </div>
  );
};

export default RoutineEditorPage;
