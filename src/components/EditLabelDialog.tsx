
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
import { Trash2, X, Save } from 'lucide-react';
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
        <DialogContent className="sm:max-w-[425px] border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit Label</DialogTitle>
              <DialogDescription className="text-white/80">
                Make changes to the label name, timestamp, and playback offset.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-label-name" className="text-right text-white">
                  Label Name
                </Label>
                <Input
                  id="edit-label-name"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  className="col-span-3 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                  placeholder="e.g., Waltz Intro"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-timestamp" className="text-right text-white">
                  Timestamp
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="edit-timestamp"
                    type="number"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="flex-1 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                    step="0.1"
                  />
                  <span className="text-sm text-white/70 w-16">
                    {formatTime(parseFloat(timestamp) || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-playback-offset" className="text-right text-white">
                  Start Offset (s)
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="edit-playback-offset"
                    type="number"
                    value={playbackOffset}
                    onChange={(e) => setPlaybackOffset(e.target.value)}
                    className="flex-1 bg-[hsl(var(--landing-bg))] border-[hsl(var(--landing-border))] text-white placeholder:text-white/50"
                    placeholder="3"
                    step="0.1"
                  />
                  <span className="text-sm text-white/70 text-xs">
                    seconds before
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
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
                  <Save className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/80">
              This action cannot be undone. This will permanently delete the label "{label.label_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white">Cancel</AlertDialogCancel>
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
