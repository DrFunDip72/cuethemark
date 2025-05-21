
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
          timestamp_seconds: parseFloat(timestamp.toFixed(3))
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
