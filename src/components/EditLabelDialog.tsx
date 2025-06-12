
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/formatTime';
import type { Label as LabelType } from './LabelList';

interface EditLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: LabelType;
  trackId: string;
}

export function EditLabelDialog({ open, onOpenChange, label, trackId }: EditLabelDialogProps) {
  const [labelName, setLabelName] = useState(label.label_name);
  const [timestamp, setTimestamp] = useState(label.timestamp_seconds);
  const [notes, setNotes] = useState(label.notes || '');
  const [playbackOffset, setPlaybackOffset] = useState(label.playback_offset_seconds || 3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
        .update({
          label_name: labelName.trim(),
          timestamp_seconds: parseFloat(timestamp.toFixed(3)),
          notes: notes,
          playback_offset_seconds: playbackOffset
        })
        .eq('id', label.id);

      if (error) {
        console.error('Error updating label:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update label",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Label updated successfully"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
            <DialogDescription>
              Make changes to the label name, timestamp, playback offset, and notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-label-name" className="text-right">
                Label Name
              </Label>
              <Input
                id="edit-label-name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Waltz Intro"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-timestamp" className="text-right">
                Timestamp
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="edit-timestamp"
                  type="number"
                  step="1"
                  min="0"
                  value={timestamp.toFixed(1)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setTimestamp(value);
                    }
                  }}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-16">
                  {formatTime(timestamp)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-playback-offset" className="text-right">
                Start Offset (s)
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="edit-playback-offset"
                  type="number"
                  step="1"
                  min="0"
                  value={playbackOffset.toFixed(1)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setPlaybackOffset(value);
                    }
                  }}
                  className="flex-1"
                  placeholder="3"
                />
                <span className="text-sm text-gray-500 text-xs">
                  seconds before
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3 min-h-[100px]"
                placeholder="Add notes about this section..."
              />
            </div>
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
    </Dialog>
  );
}
