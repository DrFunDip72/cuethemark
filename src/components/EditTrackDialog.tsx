
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Track Name</DialogTitle>
            <DialogDescription className="text-white/80">
              Change the display name of your audio track.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-track-name" className="text-right text-white">
                Track Name
              </Label>
              <Input
                id="edit-track-name"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="col-span-3 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                placeholder="e.g., Piano Concerto in C"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
