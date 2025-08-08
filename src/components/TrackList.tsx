
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

const SortableTrackItem = ({ track, notes, saveTimeouts, onNotesChange, onNavigate, onDelete }: {
  track: Track;
  notes: Record<string, string>;
  saveTimeouts: Record<string, NodeJS.Timeout>;
  onNotesChange: (trackId: string, value: string) => void;
  onNavigate: (trackId: string, e: React.MouseEvent) => void;
  onDelete: (trackId: string, e: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors bg-white"
    >
      <Link
        to={`/app/tracks/${track.id}`}
        className="block"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium">{track.filename}</h3>
              <p className="text-sm text-gray-500">
                {new Date(track.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      </Link>

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
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex(track => track.id === active.id);
      const newIndex = tracks.findIndex(track => track.id === over.id);

      const newTracks = arrayMove(tracks, oldIndex, newIndex);
      setTracks(newTracks);

      // Update the order in the database
      try {
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tracks.map(track => track.id)} strategy={verticalListSortingStrategy}>
          {tracks.map((track) => (
            <SortableTrackItem
              key={track.id}
              track={track}
              notes={notes}
              saveTimeouts={saveTimeouts}
              onNotesChange={handleNotesChange}
              onNavigate={handleNavigateToTrack}
              onDelete={handleDeleteClick}
            />
          ))}
        </SortableContext>
      </DndContext>

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
