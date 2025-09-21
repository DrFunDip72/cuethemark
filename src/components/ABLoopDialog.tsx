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
}

export const ABLoopDialog = ({ 
  open, 
  onOpenChange, 
  labels, 
  onApplyLoop, 
  onDisableLoop,
  currentStartMarkerId,
  currentEndMarkerId 
}: ABLoopDialogProps) => {
  const [selectedStartId, setSelectedStartId] = useState<string | null>(currentStartMarkerId || null);
  const [selectedEndId, setSelectedEndId] = useState<string | null>(currentEndMarkerId || null);
  const [step, setStep] = useState<'start' | 'end'>('start');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      if (currentStartMarkerId && currentEndMarkerId) {
        setSelectedStartId(currentStartMarkerId);
        setSelectedEndId(currentEndMarkerId);
        setStep('start');
      } else {
        setSelectedStartId(null);
        setSelectedEndId(null);
        setStep('start');
      }
    }
  }, [open, currentStartMarkerId, currentEndMarkerId]);

  const handleMarkerSelect = (markerId: string) => {
    if (step === 'start') {
      setSelectedStartId(markerId);
      setSelectedEndId(null);
      setStep('end');
    } else {
      // Only allow selecting end marker if it comes after start marker
      const startLabel = labels.find(l => l.id === selectedStartId);
      const endLabel = labels.find(l => l.id === markerId);
      
      if (startLabel && endLabel && endLabel.timestamp_seconds > startLabel.timestamp_seconds) {
        setSelectedEndId(markerId);
      }
    }
  };

  const handleApplyLoop = () => {
    if (selectedStartId && selectedEndId) {
      onApplyLoop(selectedStartId, selectedEndId);
      onOpenChange(false);
    }
  };

  const handleDisableLoop = () => {
    onDisableLoop();
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedStartId(null);
    setSelectedEndId(null);
    setStep('start');
  };

  const canApply = selectedStartId && selectedEndId;
  const hasCurrentLoop = currentStartMarkerId && currentEndMarkerId;

  // Sort labels by timestamp for display
  const sortedLabels = [...labels].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            A-B Loop Setup
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
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
                {step === 'start' ? 'Select Start Marker (A)' : 'Select End Marker (B)'}
              </div>
              {(selectedStartId || selectedEndId) && (
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

            {selectedStartId && (
              <div className="text-xs text-muted-foreground">
                Start: {labels.find(l => l.id === selectedStartId)?.label_name}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1">
              {sortedLabels.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No markers available. Add markers to use A-B loop.
                </div>
              ) : (
                sortedLabels.map((label) => {
                  const isSelected = label.id === selectedStartId || label.id === selectedEndId;
                  const isDisabled = step === 'end' && selectedStartId && 
                    label.timestamp_seconds <= (labels.find(l => l.id === selectedStartId)?.timestamp_seconds || 0);
                  
                  return (
                    <Button
                      key={label.id}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between text-left h-auto p-2"
                      onClick={() => handleMarkerSelect(label.id)}
                      disabled={isDisabled}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-medium">{label.label_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(label.timestamp_seconds)}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          {label.id === selectedStartId ? 'A' : 'B'}
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