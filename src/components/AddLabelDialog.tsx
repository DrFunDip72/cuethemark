
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/formatTime';

interface AddLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentTime: number;
}

export function AddLabelDialog({ open, onOpenChange, trackId, currentTime }: AddLabelDialogProps) {
  const [labelName, setLabelName] = useState('');
  const [timestamp, setTimestamp] = useState(currentTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update timestamp when dialog opens or current time changes
  useEffect(() => {
    if (open) {
      setTimestamp(currentTime);
    }
  }, [open, currentTime]);

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLabelName('');
      setTimestamp(currentTime);
    }
    onOpenChange(open);
  };

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

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('audio_labels')
        .insert({
          track_id: trackId,
          label_name: labelName.trim(),
          timestamp_seconds: parseFloat(timestamp.toFixed(3))
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Error",
            description: "A label already exists at this timestamp",
            variant: "destructive"
          });
        } else {
          console.error('Error creating label:', error);
          toast({
            title: "Error",
            description: "Failed to create label",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Label created successfully"
      });
      
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Label</DialogTitle>
            <DialogDescription>
              Create a new label at the current timestamp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label-name" className="text-right">
                Label Name
              </Label>
              <Input
                id="label-name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Waltz Intro"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timestamp" className="text-right">
                Timestamp
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="timestamp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={timestamp}
                  onChange={(e) => setTimestamp(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-16">
                  {formatTime(timestamp)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Label'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
