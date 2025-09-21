
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const TrackItem = ({ track, notes, saveTimeouts, onNotesChange, onNavigate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: {
  track: Track;
  notes: Record<string, string>;
  saveTimeouts: Record<string, NodeJS.Timeout>;
  onNotesChange: (trackId: string, value: string) => void;
  onNavigate: (trackId: string, e: React.MouseEvent) => void;
  onDelete: (trackId: string, e: React.MouseEvent) => void;
  onMoveUp: (trackId: string) => void;
  onMoveDown: (trackId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors bg-white">
      <div className="flex justify-between items-center">
        <Link
          to={`/app/tracks/${track.id}`}
          className="block flex-1 min-w-0"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{track.filename}</h3>
            <p className="text-sm text-gray-500">
              {new Date(track.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
        
        <div className="flex gap-2 flex-shrink-0 items-center">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={(e) => onNavigate(track.id, e)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={(e) => onDelete(track.id, e)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <Button 
              size="sm"
              variant="ghost" 
              onClick={() => onMoveUp(track.id)}
              disabled={!canMoveUp}
              className="h-8 w-8 p-0 disabled:opacity-50 md:h-6 md:w-6"
            >
              <ArrowUp className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
            <Button 
              size="sm"
              variant="ghost" 
              onClick={() => onMoveDown(track.id)}
              disabled={!canMoveDown}
              className="h-8 w-8 p-0 disabled:opacity-50 md:h-6 md:w-6"
            >
              <ArrowDown className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value={`notes-${track.id}`} className="border-0">
          <AccordionTrigger className="py-2 px-0">
            <span className="text-sm text-gray-500">Notes</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Textarea 
                value={notes[track.id] || ''} 
                onChange={(e) => onNotesChange(track.id, e.target.value)}
                placeholder="Add notes about this track... (auto-saves)"
                className="min-h-[100px] text-sm"
              />
              <div className="text-xs text-gray-500">
                {saveTimeouts[track.id] ? '⏳ Saving...' : '✓ Auto-saved'}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export const TrackList = () => {
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
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

  const handleDeleteTrack = async (id: string) => {
    try {
      const { error } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      
      toast({
        title: "Success",
        description: "Track deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    } finally {
      setDeletingTrackId(null);
    }
  };

  const handleNavigateToTrack = (trackId: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    navigate(`/app/tracks/${trackId}`);
  };

  const handleDeleteClick = (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingTrackId(trackId);
  };

  if (!user) {
    return <div className="text-center py-4 text-gray-500">Please log in to view your tracks</div>;
  }

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
      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          notes={notes}
          saveTimeouts={saveTimeouts}
          onNotesChange={handleNotesChange}
          onNavigate={handleNavigateToTrack}
          onDelete={handleDeleteClick}
          onMoveUp={(trackId) => handleMoveTrack(trackId, 'up')}
          onMoveDown={(trackId) => handleMoveTrack(trackId, 'down')}
          canMoveUp={index > 0}
          canMoveDown={index < tracks.length - 1}
        />
      ))}

      <AlertDialog 
        open={!!deletingTrackId} 
        onOpenChange={(open) => !open && setDeletingTrackId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the track and all its associated labels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTrackId && handleDeleteTrack(deletingTrackId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
