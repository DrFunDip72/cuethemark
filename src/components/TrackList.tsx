
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTrackDialog } from '@/components/EditTrackDialog';
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

type Track = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
};

export const TrackList = () => {
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
          className="p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors block"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{track.filename}</h3>
              <p className="text-sm text-gray-500">
                {new Date(track.uploaded_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={(e) => handleNavigateToTrack(track.id, e)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeletingTrackId(track.id);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Link>
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
