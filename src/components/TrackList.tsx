
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Track = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
  user_id: string;
  notes?: string;
  order?: number;
};

const TrackItem = ({ track, notes, saveTimeouts, onNotesChange, onNavigate, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: {
  track: Track;
  notes: Record<string, string>;
  saveTimeouts: Record<string, NodeJS.Timeout>;
  onNotesChange: (trackId: string, value: string) => void;
  onNavigate: (trackId: string, e: React.MouseEvent) => void;
  onMoveUp: (trackId: string) => void;
  onMoveDown: (trackId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) => {
  return (
    <div className="group relative p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-lg">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--gradient-hero-start))] via-[hsl(var(--gradient-hero-mid))] to-[hsl(var(--gradient-hero-end))] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      <div className="relative flex justify-between items-center">
        <Link
          to={`/app/tracks/${track.id}`}
          className="block flex-1 min-w-0 group-hover:text-white transition-colors duration-200"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-[hsl(var(--hero-foreground))] truncate group-hover:text-white transition-colors duration-200">{track.filename}</h3>
            <p className="text-sm text-[hsl(var(--hero-foreground))]/70 group-hover:text-white/80 transition-colors duration-200">
              {new Date(track.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
        
        <div className="flex gap-2 flex-shrink-0 items-center">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={(e) => onNavigate(track.id, e)}
            className="text-[hsl(var(--hero-foreground))] hover:text-white hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-200"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <Button 
              size="sm"
              variant="ghost" 
              onClick={() => onMoveUp(track.id)}
              disabled={!canMoveUp}
              className="h-8 w-8 p-0 disabled:opacity-50 md:h-6 md:w-6 text-[hsl(var(--hero-foreground))] hover:text-white hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-200"
            >
              <ArrowUp className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
            <Button 
              size="sm"
              variant="ghost" 
              onClick={() => onMoveDown(track.id)}
              disabled={!canMoveDown}
              className="h-8 w-8 p-0 disabled:opacity-50 md:h-6 md:w-6 text-[hsl(var(--hero-foreground))] hover:text-white hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-200"
            >
              <ArrowDown className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full mt-4">
        <AccordionItem value={`notes-${track.id}`} className="border-0">
          <AccordionTrigger className="py-3 px-0 hover:no-underline">
            <span className="text-sm font-medium text-[hsl(var(--hero-foreground))]/80 group-hover:text-white/90 transition-colors duration-200">Notes</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <Textarea 
                value={notes[track.id] || ''} 
                onChange={(e) => onNotesChange(track.id, e.target.value)}
                placeholder="Add notes about this track... (auto-saves)"
                className="min-h-[100px] text-sm bg-white/10 border-white/20 text-[hsl(var(--hero-foreground))] placeholder:text-[hsl(var(--hero-foreground))]/50 focus:border-white/40 focus:bg-white/15 transition-all duration-200"
              />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  saveTimeouts[track.id] ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                }`} />
                <span className="text-xs text-[hsl(var(--hero-foreground))]/70">
                  {saveTimeouts[track.id] ? 'Saving...' : 'Auto-saved'}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const TrackList = () => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [tracks, setTracks] = useState<Track[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tracksData, isLoading, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });
      
      if (error) throw error;
      return data as Track[];
    },
    enabled: !!user,
  });

  // Update local tracks state when data changes
  useEffect(() => {
    if (tracksData) {
      setTracks(tracksData);
    }
  }, [tracksData]);

  // Initialize notes from tracks
  useEffect(() => {
    if (tracks) {
      const initialNotes: Record<string, string> = {};
      tracks.forEach(track => {
        initialNotes[track.id] = track.notes || '';
      });
      setNotes(initialNotes);
    }
  }, [tracks]);

  // Auto-save notes with debouncing
  const handleNotesChange = (trackId: string, value: string) => {
    setNotes(prev => ({ ...prev, [trackId]: value }));
    
    // Clear existing timeout for this track
    if (saveTimeouts[trackId]) {
      clearTimeout(saveTimeouts[trackId]);
    }
    
    // Set new timeout to save after 1 second of no typing
    const timeoutId = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('audio_tracks')
          .update({ notes: value })
          .eq('id', trackId);
          
        if (error) throw error;
        
        // Remove the timeout from state after successful save
        setSaveTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[trackId];
          return newTimeouts;
        });
      } catch (error) {
        console.error('Error auto-saving notes:', error);
        toast({
          title: "Auto-save failed",
          description: "Could not save notes automatically",
          variant: "destructive"
        });
      }
    }, 1000);
    
    setSaveTimeouts(prev => ({ ...prev, [trackId]: timeoutId }));
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [saveTimeouts]);

  const handleMoveTrack = async (trackId: string, direction: 'up' | 'down') => {
    const currentIndex = tracks.findIndex(track => track.id === trackId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;

    // Optimistically update the UI
    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(currentIndex, 1);
    newTracks.splice(newIndex, 0, movedTrack);
    setTracks(newTracks);

    try {
      // Update the order in the database
      const updates = newTracks.map((track, index) => ({
        id: track.id,
        order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('audio_tracks')
          .update({ order: update.order })
          .eq('id', update.id);
      }

      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    } catch (error) {
      console.error('Error updating track order:', error);
      toast({
        title: "Error",
        description: "Failed to update track order",
        variant: "destructive"
      });
      // Revert the local state if the database update fails
      setTracks(tracksData || []);
    }
  };

  const handleNavigateToTrack = (trackId: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    navigate(`/app/tracks/${trackId}`);
  };

  if (!user) {
    return <div className="text-center py-8 text-[hsl(var(--hero-foreground))]/70">Please log in to view your tracks</div>;
  }

  if (isLoading) {
    return <div className="text-center py-8 text-[hsl(var(--hero-foreground))]">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">Failed to load tracks</div>;
  }

  if (!tracks?.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 max-w-md mx-auto">
          <Upload className="h-12 w-12 text-[hsl(var(--hero-foreground))]/50 mx-auto mb-4" />
          <p className="text-[hsl(var(--hero-foreground))]/70 text-lg">No tracks uploaded yet</p>
          <p className="text-[hsl(var(--hero-foreground))]/50 text-sm mt-2">Click "Upload Track" to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          notes={notes}
          saveTimeouts={saveTimeouts}
          onNotesChange={handleNotesChange}
          onNavigate={handleNavigateToTrack}
          onMoveUp={(trackId) => handleMoveTrack(trackId, 'up')}
          onMoveDown={(trackId) => handleMoveTrack(trackId, 'down')}
          canMoveUp={index > 0}
          canMoveDown={index < tracks.length - 1}
        />
      ))}

    </div>
  );
};
