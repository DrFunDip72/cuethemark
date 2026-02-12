
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditLabelDialog } from './EditLabelDialog';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  created_at: string;
  notes?: string;
  order?: number;
  playback_offset_seconds?: number;
};

type LabelListProps = {
  labels: Label[];
  currentTime: number;
  onPlayFromTimestamp: (timestamp: number) => void;
  trackId: string;
  onPauseAudio?: () => void;
  onMarkerDeleted?: (markerId: string) => void;
};

type LabelItemProps = {
  label: Label;
  activeLabel: string | null;
  notes: Record<string, string>;
  saveTimeouts: Record<string, NodeJS.Timeout>;
  onNotesChange: (labelId: string, value: string) => void;
  onEdit: (label: Label) => void;
  onPlayFromLabel: (label: Label) => void;
  onMoveUp: (labelId: string) => void;
  onMoveDown: (labelId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

const LabelItem = ({ 
  label, 
  activeLabel, 
  notes, 
  saveTimeouts, 
  onNotesChange, 
  onEdit, 
  onPlayFromLabel,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: LabelItemProps) => {
  return (
    <Card
      className={`p-4 transition-colors hover:bg-[hsl(var(--landing-surface-hover))] ${
        activeLabel === label.id ? '' : ''
      }`}
      style={{
        backgroundColor: "hsl(var(--landing-surface))",
        borderColor: activeLabel === label.id ? "hsl(var(--landing-accent))" : "hsl(var(--landing-border))",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex min-h-[44px] items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => onPlayFromLabel(label)}
        >
          <div className="flex min-h-[44px] min-w-[44px] items-center justify-center md:min-h-0 md:min-w-0">
            <Play className="h-4 w-4 flex-shrink-0 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate text-white">{label.label_name}</h3>
            <Badge
              variant="secondary"
              className="text-white/90"
              style={{
                backgroundColor: "hsl(var(--landing-surface-hover))",
                borderColor: "hsl(var(--landing-border))",
              }}
            >
              {formatTime(label.timestamp_seconds)}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(label)}
            className="min-h-[44px] min-w-[44px] md:min-h-9 md:min-w-9 text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveUp(label.id)}
              disabled={!canMoveUp}
              className="min-h-[44px] min-w-[44px] p-0 disabled:opacity-50 md:h-6 md:w-6 md:min-h-0 md:min-w-0 text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveDown(label.id)}
              disabled={!canMoveDown}
              className="min-h-[44px] min-w-[44px] p-0 disabled:opacity-50 md:h-6 md:w-6 md:min-h-0 md:min-w-0 text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value={`notes-${label.id}`} className="border-0">
          <AccordionTrigger className="py-2 px-0 text-white hover:no-underline [&_svg]:text-white">
            <span className="text-sm">Notes</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Textarea
                value={notes[label.id] || ''}
                onChange={(e) => onNotesChange(label.id, e.target.value)}
                placeholder="Add notes about this section... (auto-saves)"
                className="min-h-[100px] text-sm"
                style={{
                  backgroundColor: "hsl(var(--landing-bg))",
                  borderColor: "hsl(var(--landing-border))",
                  color: "hsl(var(--landing-text))",
                }}
              />
              <div className="text-xs text-white/80">
                {saveTimeouts[label.id] ? '⏳ Saving...' : '✓ Auto-saved'}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export const LabelList = ({ labels, currentTime, onPlayFromTimestamp, trackId, onPauseAudio, onMarkerDeleted }: LabelListProps) => {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [isNotesUpdating, setIsNotesUpdating] = useState<Record<string, boolean>>({});
  const [localLabels, setLocalLabels] = useState<Label[]>(labels);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update local labels when props change
  useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  // Find the active label based on current time
  useEffect(() => {
    const currentLabel = localLabels.find(
      (label) => currentTime >= label.timestamp_seconds && 
      (currentTime < (localLabels.find(l => l.timestamp_seconds > label.timestamp_seconds)?.timestamp_seconds || Infinity))
    );
    setActiveLabel(currentLabel?.id || null);
  });

  // Initialize notes from labels
  useEffect(() => {
    const initialNotes: Record<string, string> = {};
    localLabels.forEach(label => {
      initialNotes[label.id] = label.notes || '';
    });
    setNotes(initialNotes);
  }, [localLabels]);

  // Auto-save notes with debouncing
  const handleNotesChange = (labelId: string, value: string) => {
    setNotes(prev => ({ ...prev, [labelId]: value }));
    
    // Clear existing timeout for this label
    if (saveTimeouts[labelId]) {
      clearTimeout(saveTimeouts[labelId]);
    }
    
    // Set new timeout to save after 1 second of no typing
    const timeoutId = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('audio_labels')
          .update({ notes: value })
          .eq('id', labelId);
          
        if (error) throw error;
        
        // Remove the timeout from state after successful save
        setSaveTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[labelId];
          return newTimeouts;
        });
      } catch (error) {
        console.error('Error auto-saving notes:', error);
        toast({
          title: "Auto-save failed",
          description: "Could not save notes automatically",
          variant: "destructive"
        });
      }
    }, 1000);
    
    setSaveTimeouts(prev => ({ ...prev, [labelId]: timeoutId }));
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [saveTimeouts]);

  const handleMoveLabel = async (labelId: string, direction: 'up' | 'down') => {
    const currentIndex = localLabels.findIndex(label => label.id === labelId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= localLabels.length) return;

    // Optimistically update the UI
    const newLabels = [...localLabels];
    const [movedLabel] = newLabels.splice(currentIndex, 1);
    newLabels.splice(newIndex, 0, movedLabel);
    setLocalLabels(newLabels);

    try {
      // Update the order in the database
      const updates = newLabels.map((label, index) => ({
        id: label.id,
        order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('audio_labels')
          .update({ order: update.order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Refresh the labels list
      queryClient.invalidateQueries({ queryKey: ['track-labels', trackId] });
    } catch (error) {
      console.error('Error reordering labels:', error);
      toast({
        title: "Error",
        description: "Failed to reorder labels",
        variant: "destructive"
      });
      // Revert the local state if the database update fails
      setLocalLabels(labels);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      const { error } = await supabase
        .from('audio_labels')
        .delete()
        .eq('id', labelId);
        
      if (error) throw error;
      
      // Call the marker deleted callback if provided
      onMarkerDeleted?.(labelId);
      
      // Refresh the labels list
      queryClient.invalidateQueries({ queryKey: ['track-labels', trackId] });
      
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

  const handleSaveNotes = async (labelId: string) => {
    setIsNotesUpdating({ ...isNotesUpdating, [labelId]: true });
    try {
      const { error } = await supabase
        .from('audio_labels')
        .update({ notes: notes[labelId] })
        .eq('id', labelId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Notes updated successfully"
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    } finally {
      setIsNotesUpdating({ ...isNotesUpdating, [labelId]: false });
    }
  };

  const openEditDialog = (label: Label) => {
    onPauseAudio?.();
    setEditingLabel(label);
  };

  const handlePlayFromLabel = (label: Label) => {
    const offset = label.playback_offset_seconds || 3;
    const startTime = label.timestamp_seconds - offset;
    
    // Check if the start time would be before 0:00
    if (startTime < 0) {
      const delaySeconds = Math.abs(startTime);
      
      // Show countdown toast
      toast({
        title: `Starting in ${delaySeconds} seconds...`,
        description: "Get ready!"
      });
      
      // Wait for the delay, then start playback from 0:00
      setTimeout(() => {
        onPlayFromTimestamp(0);
      }, delaySeconds * 1000);
    } else {
      // Normal playback with offset
      onPlayFromTimestamp(startTime);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {localLabels.map((label, index) => (
          <LabelItem
            key={label.id}
            label={label}
            activeLabel={activeLabel}
            notes={notes}
            saveTimeouts={saveTimeouts}
            onNotesChange={handleNotesChange}
            onEdit={openEditDialog}
            onPlayFromLabel={handlePlayFromLabel}
            onMoveUp={(labelId) => handleMoveLabel(labelId, 'up')}
            onMoveDown={(labelId) => handleMoveLabel(labelId, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < localLabels.length - 1}
          />
        ))}
      </div>
      
      {editingLabel && (
        <EditLabelDialog 
          open={!!editingLabel}
          onOpenChange={(open) => !open && setEditingLabel(null)}
          label={editingLabel}
          trackId={trackId}
          onDelete={handleDeleteLabel}
        />
      )}
    </>
  );
};
