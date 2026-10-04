import { AUDIO_BUCKET, supabase, type Routine } from './supabase';

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const AUDIO_ACCEPT = 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac,.mp3,.wav,.m4a';

export const validateAudio = (file: File): string | null => {
  if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a)$/i.test(file.name)) return 'Please choose an MP3, WAV, or M4A file.';
  if (file.size > MAX_AUDIO_BYTES) return `That file is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is 50 MB.`;
  return null;
};

export const titleFromFilename = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 200) || 'Untitled routine';

const uploadAudioFile = async (userId: string, routineId: string, file: File) => {
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `${userId}/${routineId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    cacheControl: '31536000',
  });
  if (error) throw error;
  return path;
};

export const createRoutineFromFile = async (userId: string, file: File): Promise<Routine> => {
  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ title: titleFromFilename(file.name) })
    .select()
    .single();
  if (error) throw error;

  try {
    const path = await uploadAudioFile(userId, routine.id, file);
    const { data, error: updateError } = await supabase
      .from('routines')
      .update({ audio_path: path })
      .eq('id', routine.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return data as Routine;
  } catch (err) {
    await supabase.from('routines').delete().eq('id', routine.id);
    throw err;
  }
};

/** Swap the audio but keep markers and the share link, so dancers don't need a new link. */
export const replaceRoutineAudio = async (userId: string, routine: Routine, file: File) => {
  const path = await uploadAudioFile(userId, routine.id, file);
  const { error } = await supabase.from('routines').update({ audio_path: path }).eq('id', routine.id);
  if (error) throw error;
  if (routine.audio_path) await supabase.storage.from(AUDIO_BUCKET).remove([routine.audio_path]);
};

export const deleteRoutine = async (routine: Routine) => {
  if (routine.audio_path) await supabase.storage.from(AUDIO_BUCKET).remove([routine.audio_path]);
  const { error } = await supabase.from('routines').delete().eq('id', routine.id);
  if (error) throw error;
};

export const newShareId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
