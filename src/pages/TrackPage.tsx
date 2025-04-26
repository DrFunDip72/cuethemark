
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause } from 'lucide-react';

const TrackPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [view, setView] = useState<'timeline' | 'list'>('timeline');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div 
              className="h-full bg-primary rounded" 
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Track Name</h1>
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
              Timeline view will be implemented after Supabase connection
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-8">
            No labels added yet
          </div>
        </Card>
      )}

      <Button className="fixed bottom-6 right-6" size="lg">
        Add Label
      </Button>
    </div>
  );
};

export default TrackPage;
