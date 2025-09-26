import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/formatTime';
import { X, RotateCcw } from 'lucide-react';

type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  playback_offset_seconds?: number;
  notes?: string;
};

interface ABLoopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: Label[];
  onApplyLoop: (startMarkerId: string, endMarkerId: string) => void;
  onDisableLoop: () => void;
  currentStartMarkerId?: string;
  currentEndMarkerId?: string;
  abLoopEnabled?: boolean;
}

export const ABLoopDialog = ({ 
  open, 
  onOpenChange, 
  labels, 
  onApplyLoop, 
  onDisableLoop,
  currentStartMarkerId,
  currentEndMarkerId,
  abLoopEnabled = false
}: ABLoopDialogProps) => {
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());

  // Initialize selected markers when dialog opens
  useEffect(() => {
    if (open) {
      const markers = new Set<string>();
      // Only initialize with current markers if AB loop is actually enabled
      if (abLoopEnabled && currentStartMarkerId && currentEndMarkerId) {
        markers.add(currentStartMarkerId);
        markers.add(currentEndMarkerId);
      }
      setSelectedMarkers(markers);
    }
  }, [open, currentStartMarkerId, currentEndMarkerId, abLoopEnabled]);

  const handleMarkerToggle = (markerId: string) => {
    const newSelected = new Set(selectedMarkers);
    
    if (newSelected.has(markerId)) {
      // Deselect the marker
      newSelected.delete(markerId);
    } else {
      // Select the marker
      if (newSelected.size >= 2) {
        // If already have 2 selected, replace the chronologically closest one
        const selectedArray = Array.from(newSelected);
        const clickedLabel = labels.find(l => l.id === markerId);
        const selected1 = labels.find(l => l.id === selectedArray[0]);
        const selected2 = labels.find(l => l.id === selectedArray[1]);
        
        if (clickedLabel && selected1 && selected2) {
          const diff1 = Math.abs(clickedLabel.timestamp_seconds - selected1.timestamp_seconds);
          const diff2 = Math.abs(clickedLabel.timestamp_seconds - selected2.timestamp_seconds);
          
          // Remove the closer one and add the new one
          if (diff1 < diff2) {
            newSelected.delete(selectedArray[0]);
          } else {
            newSelected.delete(selectedArray[1]);
          }
        }
      }
      newSelected.add(markerId);
    }
    
    setSelectedMarkers(newSelected);
  };

  const handleApplyLoop = () => {
    const selectedArray = Array.from(selectedMarkers);
    if (selectedArray.length === 2) {
      const label1 = labels.find(l => l.id === selectedArray[0]);
      const label2 = labels.find(l => l.id === selectedArray[1]);
      
      if (label1 && label2) {
        // Auto-assign A (start) and B (end) based on timestamps
        const startLabel = label1.timestamp_seconds <= label2.timestamp_seconds ? label1 : label2;
        const endLabel = label1.timestamp_seconds > label2.timestamp_seconds ? label1 : label2;
        
        onApplyLoop(startLabel.id, endLabel.id);
        onOpenChange(false);
      }
    }
  };

  const handleDisableLoop = () => {
    onDisableLoop();
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedMarkers(new Set());
    // Also disable the current AB loop but keep dialog open
    onDisableLoop();
  };

  const canApply = selectedMarkers.size === 2;
  const hasCurrentLoop = abLoopEnabled && currentStartMarkerId && currentEndMarkerId;

  // Sort labels by timestamp for display
  const sortedLabels = [...labels].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  
  // Get the auto-assigned A and B markers
  const selectedArray = Array.from(selectedMarkers);
  let startMarkerId = null;
  let endMarkerId = null;
  
  if (selectedArray.length === 2) {
    const label1 = labels.find(l => l.id === selectedArray[0]);
    const label2 = labels.find(l => l.id === selectedArray[1]);
    
    if (label1 && label2) {
      const startLabel = label1.timestamp_seconds <= label2.timestamp_seconds ? label1 : label2;
      const endLabel = label1.timestamp_seconds > label2.timestamp_seconds ? label1 : label2;
      startMarkerId = startLabel.id;
      endMarkerId = endLabel.id;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>A-B Loop Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasCurrentLoop && (
            <Card className="p-3 bg-muted">
              <div className="text-sm text-muted-foreground mb-2">Current Loop:</div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div>A: {labels.find(l => l.id === currentStartMarkerId)?.label_name}</div>
                  <div>B: {labels.find(l => l.id === currentEndMarkerId)?.label_name}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableLoop}
                >
                  Turn Off
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Select any two markers for A-B loop
              </div>
              {selectedMarkers.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {selectedMarkers.size === 2 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>A (start): {labels.find(l => l.id === startMarkerId)?.label_name}</div>
                <div>B (end): {labels.find(l => l.id === endMarkerId)?.label_name}</div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1">
              {sortedLabels.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No markers available. Add markers to use A-B loop.
                </div>
              ) : (
                sortedLabels.map((label) => {
                  const isSelected = selectedMarkers.has(label.id);
                  const isStart = label.id === startMarkerId;
                  const isEnd = label.id === endMarkerId;
                  
                  return (
                    <Button
                      key={label.id}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between text-left h-auto p-2"
                      onClick={() => handleMarkerToggle(label.id)}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-medium">{label.label_name}</div>
                        <div className={`text-xs ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                          {formatTime(label.timestamp_seconds)}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          {isStart ? 'A' : isEnd ? 'B' : '•'}
                        </Badge>
                      )}
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApplyLoop}
              disabled={!canApply}
            >
              Apply Loop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};