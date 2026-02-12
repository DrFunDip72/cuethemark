
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
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime, roundToOneDecimal } from '@/lib/formatTime';
import { useQueryClient } from '@tanstack/react-query';

interface AddLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentTime: number;
}

export function AddLabelDialog({ open, onOpenChange, trackId, currentTime }: AddLabelDialogProps) {
  const [labelName, setLabelName] = useState('');
  const [timestamp, setTimestamp] = useState(currentTime.toString());
  const [playbackOffset, setPlaybackOffset] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Capture the current time when the dialog opens, rounded to 1 decimal
  useEffect(() => {
    if (open) {
      setTimestamp(roundToOneDecimal(currentTime).toString());
    }
  }, [open, currentTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!labelName.trim()) {
      toast({
        title: "Error",
        description: "Label name is required",
        variant: "destructive"
      });
      return;
    }

    const timestampValue = parseFloat(timestamp) || 0;
    const offsetValue = parseFloat(playbackOffset) || 3;

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to add labels",
          variant: "destructive"
        });
        return;
      }

      // Get all labels for this track to determine proper order
      const { data: existingLabels, error: fetchError } = await supabase
        .from('audio_labels')
        .select('timestamp_seconds, order')
        .eq('track_id', trackId)
        .order('timestamp_seconds', { ascending: true });

      if (fetchError) throw fetchError;

      // Find where this new label should be inserted based on timestamp
      let newOrder = existingLabels.length + 1;
      for (let i = 0; i < existingLabels.length; i++) {
        if (timestampValue < existingLabels[i].timestamp_seconds) {
          newOrder = i + 1;
          break;
        }
      }

      // Insert the new label
      const { error: insertError } = await supabase
        .from('audio_labels')
        .insert({
          track_id: trackId,
          user_id: user.id,
          label_name: labelName.trim(),
          timestamp_seconds: roundToOneDecimal(timestampValue),
          playback_offset_seconds: roundToOneDecimal(offsetValue),
          order: newOrder
        });

      if (insertError) throw insertError;

      // Update order for all labels that should come after this new one
      if (newOrder <= existingLabels.length) {
        const { data: allLabels, error: getAllError } = await supabase
          .from('audio_labels')
          .select('id, timestamp_seconds')
          .eq('track_id', trackId)
          .order('timestamp_seconds', { ascending: true });

        if (getAllError) throw getAllError;

        // Update order for all labels
        for (let i = 0; i < allLabels.length; i++) {
          const { error: orderError } = await supabase
            .from('audio_labels')
            .update({ order: i + 1 })
            .eq('id', allLabels[i].id);
            
          if (orderError) throw orderError;
        }
      }

      toast({
        title: "Success",
        description: "Label added successfully"
      });
      
      // Reset form
      setLabelName('');
      setTimestamp(currentTime.toString());
      setPlaybackOffset('3');
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['track-labels', trackId] });
      
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

  const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimestamp(e.target.value);
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackOffset(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add New Label</DialogTitle>
            <DialogDescription className="text-white/80">
              Create a new label at the current playback position or specify a custom time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label-name" className="text-right text-white">
                Label
              </Label>
              <Input
                id="label-name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                className="col-span-3 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                placeholder="e.g., Chorus, Verse, Drop"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timestamp" className="text-right text-white">
                Timestamp (s)
              </Label>
              <Input
                id="timestamp"
                type="number"
                step="0.1"
                value={timestamp}
                onChange={handleTimestampChange}
                className="col-span-3 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="playback-offset" className="text-right text-white">
                Start Offset (s)
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="playback-offset"
                  type="number"
                  step="0.1"
                  value={playbackOffset}
                  onChange={handleOffsetChange}
                  className="flex-1 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                  placeholder="3"
                />
                <span className="text-sm text-white/70 text-xs">
                  seconds before
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm" style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
