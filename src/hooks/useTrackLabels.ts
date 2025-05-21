
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  created_at: string;
};

export const useTrackLabels = (trackId: string) => {
  const queryClient = useQueryClient();

  const { data: labels, isLoading, error } = useQuery({
    queryKey: ['track-labels', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_labels')
        .select('*')
        .eq('track_id', trackId)
        .order('timestamp_seconds', { ascending: true });

      if (error) throw error;
      return data as Label[];
    },
    // Enable auto-refresh
    refetchInterval: 3000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'audio_labels',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Invalidate query to refresh data
          queryClient.invalidateQueries({ queryKey: ['track-labels', trackId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, queryClient]);

  return { labels, isLoading, error };
};
