
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useAuth } from '@/contexts/AuthContext';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Track = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
  user_id: string;
  order?: number;
};

type SortableTrackItemProps = {
  track: Track;
  onEdit: (track: Track) => void;
  onDelete: (trackId: string) => void;
  onNavigate: (trackId: string, e: React.MouseEvent) => void;
};

const SortableTrackItem = ({ track, onEdit, onDelete, onNavigate }: SortableTrackItemProps) => {
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
  };

  return (
    <Link
      ref={setNodeRef}
      style={style}
      to={`/tracks/${track.id}`}
      className={`p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors block ${
        isDragging ? 'shadow-lg rotate-1' : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{track.filename}</h3>
          <p className="text-sm text-gray-500">
            {new Date(track.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 items-center">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(track.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export const TrackList = () => {
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
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
  
  const { data: tracks, isLoading, error } = useQuery({
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !tracks) {
      return;
    }

    const oldIndex = tracks.findIndex(track => track.id === active.id);
    const newIndex = tracks.findIndex(track => track.id === over.id);

    const reorderedTracks = arrayMove(tracks, oldIndex, newIndex);

    // Update the order values for all affected tracks
    const updates = reorderedTracks.map((track, index) => ({
      id: track.id,
      order: index + 1
    }));

    try {
      // Update all tracks with new order
      for (const update of updates) {
        const { error } = await supabase
          .from('audio_tracks')
          .update({ order: update.order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Refresh the tracks list
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      
      toast({
        title: "Success",
        description: "Tracks reordered successfully"
      });
    } catch (error) {
      console.error('Error reordering tracks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tracks",
        variant: "destructive"
      });
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
    navigate(`/tracks/${trackId}`);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {tracks.map((track) => (
            <SortableTrackItem
              key={track.id}
              track={track}
              onEdit={setEditingTrack}
              onDelete={setDeletingTrackId}
              onNavigate={handleNavigateToTrack}
            />
          ))}
        </div>
      </SortableContext>

      {editingTrack && (
        <EditTrackDialog 
          open={!!editingTrack}
          onOpenChange={(open) => !open && setEditingTrack(null)}
          track={editingTrack}
        />
      )}

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
    </DndContext>
  );
};
