
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

type Track = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
};

export const TrackList = () => {
  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as Track[];
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Failed to load tracks</div>;
  }

  if (!tracks?.length) {
    return <div className="text-center py-4 text-gray-500">No tracks uploaded yet</div>;
  }

  return (
    <div className="grid gap-4">
      {tracks.map((track) => (
        <Link
          key={track.id}
          to={`/tracks/${track.id}`}
          className="p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors"
        >
          <h3 className="font-medium">{track.filename}</h3>
          <p className="text-sm text-gray-500">
            {new Date(track.uploaded_at).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
};
