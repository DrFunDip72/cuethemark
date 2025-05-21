
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditLabelDialog } from './EditLabelDialog';

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
  const { toast } = useToast();

  useEffect(() => {
    const currentLabel = labels.find(
      (label) => currentTime >= label.timestamp_seconds && 
      (currentTime < (labels.find(l => l.timestamp_seconds > label.timestamp_seconds)?.timestamp_seconds || Infinity))
    );
    setActiveLabel(currentLabel?.id || null);
  }, [currentTime, labels]);

  const handleMoveLabel = async (label: Label, direction: 'up' | 'down') => {
    const sortedLabels = [...labels].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    const currentIndex = sortedLabels.findIndex(l => l.id === label.id);
    
    // Determine target index based on direction
    const targetIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(sortedLabels.length - 1, currentIndex + 1);
    
    // Don't proceed if we're already at the first/last position
    if (currentIndex === targetIndex) return;
    
    // Get the target label
    const targetLabel = sortedLabels[targetIndex];
    
    try {
      // Simple approach: directly swap positions by
      // giving each label a completely new timestamp
      // that doesn't conflict with existing ones
      
      // Get a timestamp that's outside the normal range
      // and different for each label involved in the swap
      const baseOffset = 1000000; // A large number unlikely to be used
      const tempTimestamp1 = baseOffset + 1;
      const tempTimestamp2 = baseOffset + 2;
      
      // First, move both labels to temporary timestamps to avoid conflicts
      const { error: error1 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: tempTimestamp1 })
        .eq('id', label.id);
        
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: tempTimestamp2 })
        .eq('id', targetLabel.id);
        
      if (error2) throw error2;
      
      // Then, update them to their final position values
      const { error: error3 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: targetLabel.timestamp_seconds })
        .eq('id', label.id);
        
      if (error3) throw error3;
      
      const { error: error4 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: label.timestamp_seconds })
        .eq('id', targetLabel.id);
        
      if (error4) throw error4;
      
      toast({
        title: "Success",
        description: "Label position updated"
      });
    } catch (error) {
      console.error('Error updating label position:', error);
      toast({
        title: "Error",
        description: "Failed to update label position",
        variant: "destructive"
      });
    }
  };

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
              <Button size="icon" variant="ghost" onClick={() => handleMoveLabel(label, 'up')}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleMoveLabel(label, 'down')}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => handleDeleteLabel(label.id)}
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
    </div>
  );
};
