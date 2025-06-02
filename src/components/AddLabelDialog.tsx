
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface AddLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentTime: number;
}

export const AddLabelDialog = ({ open, onOpenChange, trackId, currentTime }: AddLabelDialogProps) => {
  const [labelName, setLabelName] = useState('');
  const [notes, setNotes] = useState('');
  const [playbackOffset, setPlaybackOffset] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!labelName.trim() || !user) {
      toast({
        title: "Error",
        description: !user ? "You must be logged in to add labels" : "Label name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('audio_labels')
        .insert([{
          track_id: trackId,
          user_id: user.id,
          label_name: labelName.trim(),
          timestamp_seconds: currentTime,
          notes: notes.trim() || null,
          playback_offset_seconds: playbackOffset,
        }]);

      if (error) {
        console.error('Error creating label:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create label",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Label added successfully"
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['track-labels', trackId] });
      
      // Reset form and close dialog
      setLabelName('');
      setNotes('');
      setPlaybackOffset(3);
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Label</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label-name" className="text-right">
                Label
              </Label>
              <Input
                id="label-name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Chorus, Verse, Drop"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Optional notes about this section"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="playback-offset" className="text-right">
                Start Offset (s)
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="playback-offset"
                  type="number"
                  step="0.5"
                  min="0"
                  value={playbackOffset}
                  onChange={(e) => setPlaybackOffset(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  placeholder="3"
                />
                <span className="text-sm text-gray-500 text-xs">
                  seconds before
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <span className="col-span-3 text-sm text-gray-600">
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Label'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
