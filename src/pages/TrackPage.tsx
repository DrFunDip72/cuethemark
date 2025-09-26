
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Plus, Pen, RotateCcw, Repeat, Gauge, Trash2 } from 'lucide-react';
import { useTrackLabels } from '@/hooks/useTrackLabels';
import { LabelList } from '@/components/LabelList';
import { Timeline } from '@/components/Timeline';
import { AddLabelDialog } from '@/components/AddLabelDialog';
import { ABLoopDialog } from '@/components/ABLoopDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime, roundToOneDecimal, formatTimeForDisplay } from '@/lib/formatTime';
import { Slider } from '@/components/ui/slider';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
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

type TrackData = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
};

const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [view, setView] = useState<'timeline' | 'list'>('list');
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [addLabelOpen, setAddLabelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editTrackOpen, setEditTrackOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedInput, setSpeedInput] = useState('1');
  const [autoLoop, setAutoLoop] = useState(false);
  const [abLoopEnabled, setAbLoopEnabled] = useState(false);
  const [abLoopStart, setAbLoopStart] = useState<number | null>(null);
  const [abLoopEnd, setAbLoopEnd] = useState<number | null>(null);
  const [abLoopStartMarkerId, setAbLoopStartMarkerId] = useState<string | null>(null);
  const [abLoopEndMarkerId, setAbLoopEndMarkerId] = useState<string | null>(null);
  const [showAbLoopDialog, setShowAbLoopDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { labels, isLoading: labelsLoading } = useTrackLabels(id || '');
  // Apply playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    // Sync speedInput with playbackRate
    setSpeedInput(playbackRate.toString());
  }, [playbackRate]);

  // Apply playback rate when trackUrl is loaded
  useEffect(() => {
    if (audioRef.current && trackUrl) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [trackUrl, playbackRate]);

  // Load saved timestamp when component mounts
  useEffect(() => {
    if (id && audioRef.current) {
      const savedTime = localStorage.getItem(`track-${id}-timestamp`);
      if (savedTime) {
        const time = roundToOneDecimal(parseFloat(savedTime));
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }
  }, [id, trackUrl]);

  // Load saved settings when component mounts
  useEffect(() => {
    if (id) {
      // Load playback rate
      const savedRate = localStorage.getItem(`track-${id}-playbackRate`);
      console.log(`Loading playback rate for track ${id}:`, savedRate);
      if (savedRate) {
        const rate = parseFloat(savedRate);
        if (!isNaN(rate) && rate >= 0.5 && rate <= 2) {
          console.log(`Setting playback rate to:`, rate);
          setPlaybackRate(rate);
        }
      }

      // Load auto-loop setting
      const savedAutoLoop = localStorage.getItem(`track-${id}-autoLoop`);
      if (savedAutoLoop === 'true') {
        setAutoLoop(true);
      }

      // Clean up any existing A-B loop localStorage entries (session-only now)
      localStorage.removeItem(`track-${id}-abLoop`);
    }
  }, [id]);

  // Save timestamp when it changes (rounded to 1 decimal)
  useEffect(() => {
    if (id && currentTime > 0) {
      const roundedTime = roundToOneDecimal(currentTime);
      localStorage.setItem(`track-${id}-timestamp`, roundedTime.toString());
    }
  }, [id, currentTime]);

  // Save settings when they change
  useEffect(() => {
    if (id) {
      console.log(`Saving playback rate for track ${id}:`, playbackRate);
      localStorage.setItem(`track-${id}-playbackRate`, playbackRate.toString());
    }
  }, [id, playbackRate]);

  useEffect(() => {
    if (id) {
      if (autoLoop) {
        localStorage.setItem(`track-${id}-autoLoop`, 'true');
      } else {
        localStorage.removeItem(`track-${id}-autoLoop`);
      }
    }
  }, [id, autoLoop]);

  const { data: trackData } = useQuery({
    queryKey: ['track', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as TrackData;
    }
  });

  useEffect(() => {
    const fetchTrackUrl = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('audio_tracks')
          .select('url')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching track:', error);
          toast({
            title: "Error",
            description: "Could not load audio track",
            variant: "destructive"
          });
          return;
        }

        setTrackUrl(data.url);
      } catch (err) {
        console.error('Unexpected error:', err);
        toast({
          title: "Error", 
          description: "Could not load audio track",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackUrl();
  }, [id, toast]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
        toast({
          title: "Playback Error",
          description: "Could not play audio track",
          variant: "destructive"
        });
      });
    }
  };

  const handlePlayFromTimestamp = (timestamp: number) => {
    if (audioRef.current) {
      const roundedTimestamp = roundToOneDecimal(timestamp);
      audioRef.current.currentTime = roundedTimestamp;
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
        toast({
          title: "Playback Error",
          description: "Could not play audio track",
          variant: "destructive"
        });
      });
      setIsPlaying(true);
    }
  };

  // New function to handle seeking from timeline
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      let roundedTime = roundToOneDecimal(time);
      
      // Constrain seeking within AB loop bounds when enabled
      if (abLoopEnabled && abLoopStart !== null && abLoopEnd !== null) {
        roundedTime = Math.max(abLoopStart, Math.min(roundedTime, abLoopEnd));
      }
      
      audioRef.current.currentTime = roundedTime;
      setCurrentTime(roundedTime);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = roundToOneDecimal(audioRef.current.currentTime);
      setCurrentTime(currentTime);

      // Check A-B loop bounds
      if (abLoopEnabled && abLoopEnd && currentTime >= abLoopEnd) {
        const startTime = abLoopStart || 0;
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
    }
  };

  // New function to handle slider change
  const handleSliderChange = (value: number[]) => {
    if (audioRef.current && value.length > 0) {
      let newTime = roundToOneDecimal((value[0] / 100) * (duration || 1));
      
      // Constrain seeking within AB loop bounds when enabled
      if (abLoopEnabled && abLoopStart !== null && abLoopEnd !== null) {
        newTime = Math.max(abLoopStart, Math.min(newTime, abLoopEnd));
      }
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // New function to handle opening Add Label dialog
  const handleAddLabelClick = () => {
    // Pause the audio when opening the Add Label dialog
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    setAddLabelOpen(true);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Always update speedInput to allow typing and clearing
    setSpeedInput(value);
  };

  const handleSpeedBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    // Reset to current playbackRate if invalid input
    if (value === '' || isNaN(numValue) || numValue < 0.5 || numValue > 2) {
      setSpeedInput(playbackRate.toString());
    } else {
      // Valid input, update playbackRate
      setPlaybackRate(numValue);
    }
  };

  // Update A-B loop timestamps when labels change
  useEffect(() => {
    if (abLoopEnabled && abLoopStartMarkerId && abLoopEndMarkerId && labels) {
      const startLabel = labels.find(l => l.id === abLoopStartMarkerId);
      const endLabel = labels.find(l => l.id === abLoopEndMarkerId);
      
      if (startLabel && endLabel) {
        const startTime = Math.max(0, startLabel.timestamp_seconds - (startLabel.playback_offset_seconds || 0));
        setAbLoopStart(startTime);
        setAbLoopEnd(endLabel.timestamp_seconds);
      }
    } else {
      setAbLoopStart(null);
      setAbLoopEnd(null);
    }
  }, [abLoopEnabled, abLoopStartMarkerId, abLoopEndMarkerId, labels]);

  const handleAutoLoopToggle = () => {
    setAutoLoop(!autoLoop);
  };

  const handleAbLoopApply = (startMarkerId: string, endMarkerId: string) => {
    setAbLoopStartMarkerId(startMarkerId);
    setAbLoopEndMarkerId(endMarkerId);
    setAbLoopEnabled(true);
    
    // Auto-seek to start position and pause
    if (audioRef.current && labels) {
      const startLabel = labels.find(l => l.id === startMarkerId);
      if (startLabel) {
        const seekTime = Math.max(0, startLabel.timestamp_seconds - (startLabel.playback_offset_seconds || 0));
        audioRef.current.currentTime = roundToOneDecimal(seekTime);
        setCurrentTime(roundToOneDecimal(seekTime));
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleAbLoopDisable = () => {
    setAbLoopEnabled(false);
    // Clear all AB loop state
    setAbLoopStartMarkerId(null);
    setAbLoopEndMarkerId(null);
    setAbLoopStart(null);
    setAbLoopEnd(null);
    
    toast({
      title: "AB Loop Disabled",
      description: "AB loop has been turned off"
    });
  };

  const handleMarkerDeleted = (deletedMarkerId: string) => {
    // Check if the deleted marker was part of the AB loop
    if (abLoopEnabled && (deletedMarkerId === abLoopStartMarkerId || deletedMarkerId === abLoopEndMarkerId)) {
      // Disable AB loop and clear state
      setAbLoopEnabled(false);
      setAbLoopStartMarkerId(null);
      setAbLoopEndMarkerId(null);
      setAbLoopStart(null);
      setAbLoopEnd(null);
      
      toast({
        title: "AB Loop Disabled",
        description: "AB loop was disabled because a marker was deleted"
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (autoLoop && !abLoopEnabled) {
      // Only auto-loop if A-B loop is not active
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      // First delete all associated labels
      const { error: labelsError } = await supabase
        .from('audio_labels')
        .delete()
        .eq('track_id', id);

      if (labelsError) {
        console.error('Error deleting labels:', labelsError);
        throw labelsError;
      }

      // Then delete the track
      const { error: trackError } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('id', id);

      if (trackError) {
        console.error('Error deleting track:', trackError);
        throw trackError;
      }

      toast({
        title: "Success",
        description: "Track and all associated labels deleted successfully"
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track', id] });
      
      // Navigate back to tracks
      navigate('/app/tracks');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Track title and view controls */}
      <div className="mb-6">
        {/* Title row - right aligned on mobile and desktop */}
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight break-words">
            {trackData?.filename || "Track Name"}
          </h1>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setEditTrackOpen(true)}
            className="flex-shrink-0 mt-1"
          >
            <Pen className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Timeline/Labels buttons - centered and full width on mobile, normal on desktop */}
        <div className="flex gap-2 justify-center sm:justify-end">
          <Button
            variant={view === 'timeline' ? 'default' : 'outline'}
            onClick={() => setView('timeline')}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Timeline
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Labels
          </Button>
        </div>
      </div>

      {/* Audio player controls */}
      <Card className="p-6 mb-6">
        {/* First row: Play button, slider, and timestamp */}
        <div className="flex items-center gap-4 mb-4">
          <Button 
            size="icon" 
            variant="outline"
            onClick={handlePlayPause}
            disabled={isLoading || !trackUrl}
            className="flex-shrink-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Slider 
            className="flex-1" 
            value={[duration ? (currentTime / duration) * 100 : 0]} 
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={0.1}
            disabled={isLoading || !trackUrl}
          />
          
          <div className="text-sm font-medium text-muted-foreground flex-shrink-0">
            {formatTimeForDisplay(currentTime)} / {formatTimeForDisplay(duration)}
          </div>
        </div>
        
        {/* Second row: Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center">
              <Input
                type="number"
                value={speedInput}
                onChange={handleSpeedChange}
                onBlur={handleSpeedBlur}
                min="0.5"
                max="2"
                step="0.05"
                className="w-16 h-8 text-center text-sm"
                disabled={isLoading || !trackUrl}
              />
              <span className="text-sm text-muted-foreground ml-1">x</span>
            </div>
          </div>

          <Button
            size="sm"
            variant={autoLoop ? "default" : "outline"}
            onClick={handleAutoLoopToggle}
            disabled={isLoading || !trackUrl}
            className="h-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={abLoopEnabled ? "default" : "outline"}
            onClick={() => {
              if (audioRef.current && isPlaying) {
                audioRef.current.pause();
              }
              setShowAbLoopDialog(true);
            }}
            disabled={isLoading || !trackUrl}
            className="h-8"
          >
            <span className="text-sm font-medium">A</span>
            <RotateCcw className="h-3 w-3 mx-1" />
            <span className="text-sm font-medium">B</span>
          </Button>
        </div>
      </Card>

      {view === 'timeline' ? (
        <Timeline
          labels={labels || []}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onPlayFromTimestamp={handlePlayFromTimestamp}
          abLoopEnabled={abLoopEnabled}
          abLoopStart={abLoopStart}
          abLoopEnd={abLoopEnd}
        />
      ) : (
        <Card className="p-6">
          {labelsLoading ? (
            <div className="text-center py-4">Loading labels...</div>
          ) : labels?.length ? (
            <LabelList
              labels={labels}
              currentTime={currentTime}
              onPlayFromTimestamp={handlePlayFromTimestamp}
              trackId={id || ''}
              onPauseAudio={() => {
                if (audioRef.current && isPlaying) {
                  audioRef.current.pause();
                }
              }}
              onMarkerDeleted={handleMarkerDeleted}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              No labels added yet
            </div>
          )}
        </Card>
      )}

      {/* Delete Track Section - only shown in labels view */}
      {view === 'list' && (
        <Card className="p-6 mt-8 border-destructive/20">
          <div className="text-center space-y-4">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Track
            </Button>
          </div>
        </Card>
      )}

      {mounted && createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:pb-6">
          <Button
            className="pointer-events-auto w-full md:w-auto md:ml-auto md:float-right"
            size="lg"
            onClick={handleAddLabelClick}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Label
          </Button>
        </div>,
        document.body
      )}

      {id && (
        <AddLabelDialog
          open={addLabelOpen}
          onOpenChange={setAddLabelOpen}
          trackId={id}
          currentTime={currentTime}
        />
      )}

      {trackData && (
        <EditTrackDialog
          open={editTrackOpen}
          onOpenChange={setEditTrackOpen}
          track={trackData}
        />
      )}

      <ABLoopDialog
        open={showAbLoopDialog}
        onOpenChange={setShowAbLoopDialog}
        labels={labels || []}
        onApplyLoop={handleAbLoopApply}
        onDisableLoop={handleAbLoopDisable}
        currentStartMarkerId={abLoopStartMarkerId || undefined}
        currentEndMarkerId={abLoopEndMarkerId || undefined}
        abLoopEnabled={abLoopEnabled}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the track "{trackData?.filename}" and all its associated labels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Track'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <audio
        ref={audioRef}
        src={trackUrl || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={(e) => setDuration(roundToOneDecimal(e.currentTarget.duration))}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleAudioEnded}
      />
    </div>
  );
};

export default TrackPage;
