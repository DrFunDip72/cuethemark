
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Track {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
}

interface EditTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function EditTrackDialog({ open, onOpenChange, track }: EditTrackDialogProps) {
  const [filename, setFilename] = useState(track.filename);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Update filename when track prop changes
  useEffect(() => {
    setFilename(track.filename);
  }, [track.filename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filename.trim()) {
      toast({
        title: "Error",
        description: "Track name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('audio_tracks')
        .update({
          filename: filename.trim()
        })
        .eq('id', track.id);

      if (error) {
        console.error('Error updating track:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update track",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Track name updated successfully"
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['track', track.id] });
      
      onOpenChange(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // First delete all associated labels
      const { error: labelsError } = await supabase
        .from('audio_labels')
        .delete()
        .eq('track_id', track.id);

      if (labelsError) {
        console.error('Error deleting labels:', labelsError);
        throw labelsError;
      }

      // Then delete the track
      const { error: trackError } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('id', track.id);

      if (trackError) {
        console.error('Error deleting track:', trackError);
        throw trackError;
      }

      toast({
        title: "Success",
        description: "Track and all associated labels deleted successfully"
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track', track.id] });
      
      // Close dialog and navigate back to tracks
      onOpenChange(false);
      navigate('/app/tracks');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Track Name</DialogTitle>
            <DialogDescription>
              Change the display name of your audio track.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-track-name" className="text-right">
                Track Name
              </Label>
              <Input
                id="edit-track-name"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Piano Concerto in C"
                autoFocus
              />
            </div>
          </div>

          {/* Delete section */}
          <div className="border-t pt-4 mt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
              disabled={isSubmitting || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Track
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will permanently delete the track and all its labels
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the track "{track.filename}" and all its associated labels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Track'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
