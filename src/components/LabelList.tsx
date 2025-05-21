
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
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
      // Use a temporary timestamp that doesn't conflict with any existing timestamp
      const tempTimestamp = -1; // This assumes negative timestamps aren't valid in your application
      
      // First update the current label to a temporary timestamp
      const { error: error1 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: tempTimestamp })
        .eq('id', label.id);
        
      if (error1) throw error1;
      
      // Then update the target label to the current label's original timestamp
      const { error: error2 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: label.timestamp_seconds })
        .eq('id', targetLabel.id);
        
      if (error2) throw error2;
      
      // Finally, update the current label to the target label's original timestamp
      const { error: error3 } = await supabase
        .from('audio_labels')
        .update({ timestamp_seconds: targetLabel.timestamp_seconds })
        .eq('id', label.id);
        
      if (error3) throw error3;
      
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
