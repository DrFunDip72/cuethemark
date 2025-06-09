import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Plus, Pen } from 'lucide-react';
import { useTrackLabels } from '@/hooks/useTrackLabels';
import { LabelList } from '@/components/LabelList';
import { AddLabelDialog } from '@/components/AddLabelDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/formatTime';
import { Slider } from '@/components/ui/slider';
import { EditTrackDialog } from '@/components/EditTrackDialog';
import { useQuery } from '@tanstack/react-query';

type TrackData = {
  id: string;
  filename: string;
  url: string;
  uploaded_at: string;
};

const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [view, setView] = useState<'timeline' | 'list'>('list');
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [addLabelOpen, setAddLabelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editTrackOpen, setEditTrackOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const { labels, isLoading: labelsLoading } = useTrackLabels(id || '');

  // Load saved timestamp when component mounts
  useEffect(() => {
    if (id && audioRef.current) {
      const savedTime = localStorage.getItem(`track-${id}-timestamp`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }
  }, [id, trackUrl]);

  // Save timestamp when it changes
  useEffect(() => {
    if (id && currentTime > 0) {
      localStorage.setItem(`track-${id}-timestamp`, currentTime.toString());
    }
  }, [id, currentTime]);

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
      // Start playing from the exact timestamp (no offset calculation here)
      audioRef.current.currentTime = timestamp;
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // New function to handle slider change
  const handleSliderChange = (value: number[]) => {
    if (audioRef.current && value.length > 0) {
      const newTime = (value[0] / 100) * (duration || 1);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            size="icon" 
            variant="outline"
            onClick={handlePlayPause}
            disabled={isLoading || !trackUrl}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Slider 
            className="w-full" 
            value={[duration ? (currentTime / duration) * 100 : 0]} 
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={0.1}
            disabled={isLoading || !trackUrl}
          />
        </div>
        
        <div className="text-center text-sm font-medium text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </Card>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            {trackData?.filename || "Track Name"}
          </h1>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setEditTrackOpen(true)}
          >
            <Pen className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'timeline' ? 'default' : 'outline'}
            onClick={() => setView('timeline')}
          >
            Timeline
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            Labels
          </Button>
        </div>
      </div>

      {view === 'timeline' ? (
        <Card className="p-6">
          <div className="h-24 relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Timeline view will be implemented soon
            </div>
          </div>
        </Card>
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
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              No labels added yet
            </div>
          )}
        </Card>
      )}

      <Button 
        className="fixed bottom-6 right-6" 
        size="lg"
        onClick={handleAddLabelClick}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Label
      </Button>

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

      <audio
        ref={audioRef}
        src={trackUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default TrackPage;
