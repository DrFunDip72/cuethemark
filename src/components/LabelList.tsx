
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditLabelDialog } from './EditLabelDialog';
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

export type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  created_at: string;
  order?: number;
};

type LabelListProps = {
  labels: Label[];
  currentTime: number;
  onPlayFromTimestamp: (timestamp: number) => void;
  trackId: string;
};

export const LabelList = ({ labels, currentTime, onPlayFromTimestamp, trackId }: LabelListProps) => {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const { toast } = useToast();

  // Find the active label based on current time
  useState(() => {
    const currentLabel = labels.find(
      (label) => currentTime >= label.timestamp_seconds && 
      (currentTime < (labels.find(l => l.timestamp_seconds > label.timestamp_seconds)?.timestamp_seconds || Infinity))
    );
    setActiveLabel(currentLabel?.id || null);
  });

  const handleDeleteLabel = async (labelId: string) => {
    try {
      const { error } = await supabase
        .from('audio_labels')
        .delete()
        .eq('id', labelId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Label deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting label:', error);
      toast({
        title: "Error",
        description: "Failed to delete label",
        variant: "destructive"
      });
    } finally {
      setDeletingLabel(null);
    }
  };

  const openEditDialog = (label: Label) => {
    setEditingLabel(label);
  };

  return (
    <div className="space-y-3">
      {labels.map((label) => (
        <Card
          key={label.id}
          className={`p-4 hover:bg-accent transition-colors ${
            activeLabel === label.id ? 'border-primary' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => {
                const startTime = Math.max(0, label.timestamp_seconds - 3);
                onPlayFromTimestamp(startTime);
              }}
            >
              <Play className="h-4 w-4 text-primary" />
              <div>
                <h3 className="font-medium">{label.label_name}</h3>
                <Badge variant="secondary">
                  {formatTime(label.timestamp_seconds)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => openEditDialog(label)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setDeletingLabel(label.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {editingLabel && (
        <EditLabelDialog 
          open={!!editingLabel}
          onOpenChange={(open) => !open && setEditingLabel(null)}
          label={editingLabel}
          trackId={trackId}
        />
      )}

      <AlertDialog open={!!deletingLabel} onOpenChange={(open) => !open && setDeletingLabel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the label.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingLabel && handleDeleteLabel(deletingLabel)}
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
