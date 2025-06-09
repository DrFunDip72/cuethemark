import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditLabelDialog } from './EditLabelDialog';
import { Textarea } from '@/components/ui/textarea';
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
};

export const LabelList = ({ labels, currentTime, onPlayFromTimestamp, trackId }: LabelListProps) => {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [isNotesUpdating, setIsNotesUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Find the active label based on current time
  useEffect(() => {
    const currentLabel = labels.find(
      (label) => currentTime >= label.timestamp_seconds && 
      (currentTime < (labels.find(l => l.timestamp_seconds > label.timestamp_seconds)?.timestamp_seconds || Infinity))
    );
    setActiveLabel(currentLabel?.id || null);
  });

  // Initialize notes from labels
  useEffect(() => {
    const initialNotes: Record<string, string> = {};
    labels.forEach(label => {
      initialNotes[label.id] = label.notes || '';
    });
    setNotes(initialNotes);
  }, [labels]);

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
              onClick={() => handlePlayFromLabel(label)}
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

          <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value={`notes-${label.id}`} className="border-0">
              <AccordionTrigger className="py-2 px-0">
                <span className="text-sm text-gray-500">Notes</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Textarea 
                    value={notes[label.id] || ''} 
                    onChange={(e) => handleNotesChange(label.id, e.target.value)}
                    placeholder="Add notes about this section... (auto-saves)"
                    className="min-h-[100px] text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    {saveTimeouts[label.id] ? '⏳ Saving...' : '✓ Auto-saved'}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
