
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
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime, roundToOneDecimal } from '@/lib/formatTime';
import { useQueryClient } from '@tanstack/react-query';
import type { Label as LabelType } from './LabelList';
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

interface EditLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: LabelType;
  trackId: string;
  onDelete?: (labelId: string) => Promise<void>;
}

export function EditLabelDialog({ open, onOpenChange, label, trackId, onDelete }: EditLabelDialogProps) {
  const [labelName, setLabelName] = useState(label.label_name);
  const [timestamp, setTimestamp] = useState(label.timestamp_seconds.toString());
  const [notes, setNotes] = useState(label.notes || '');
  const [playbackOffset, setPlaybackOffset] = useState((label.playback_offset_seconds || 3).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const originalTimestamp = label.timestamp_seconds;

    setIsSubmitting(true);

    try {
      // Check if timestamp changed - if so, we need to reorder
      const timestampChanged = timestampValue !== originalTimestamp;
      
      if (timestampChanged) {
        // Get all labels for this track to determine new order
        const { data: allLabels, error: fetchError } = await supabase
          .from('audio_labels')
          .select('id, timestamp_seconds, order')
          .eq('track_id', trackId)
          .order('timestamp_seconds', { ascending: true });

        if (fetchError) throw fetchError;

        // Update the current label first
        const { error: updateError } = await supabase
          .from('audio_labels')
          .update({
            label_name: labelName.trim(),
            timestamp_seconds: roundToOneDecimal(timestampValue),
            notes: notes,
            playback_offset_seconds: roundToOneDecimal(offsetValue)
          })
          .eq('id', label.id);

        if (updateError) throw updateError;

        // Create new ordering based on timestamp
        const updatedLabels = allLabels.map(l => 
          l.id === label.id 
            ? { ...l, timestamp_seconds: timestampValue }
            : l
        ).sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

        // Update order for all labels
        for (let i = 0; i < updatedLabels.length; i++) {
          const { error: orderError } = await supabase
            .from('audio_labels')
            .update({ order: i + 1 })
            .eq('id', updatedLabels[i].id);
            
          if (orderError) throw orderError;
        }
      } else {
        // Just update the label without reordering
        const { error } = await supabase
          .from('audio_labels')
          .update({
            label_name: labelName.trim(),
            timestamp_seconds: roundToOneDecimal(timestampValue),
            notes: notes,
            playback_offset_seconds: roundToOneDecimal(offsetValue)
          })
          .eq('id', label.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: timestampChanged 
          ? "Label updated and reordered by timestamp" 
          : "Label updated successfully"
      });
      
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

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(label.id);
      onOpenChange(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
                    type="text"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-16">
                    {formatTime(parseFloat(timestamp) || 0)}
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
                    type="text"
                    value={playbackOffset}
                    onChange={(e) => setPlaybackOffset(e.target.value)}
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

            <DialogFooter className="flex justify-between">
              <div>
                {onDelete && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the label "{label.label_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
