
import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeForDisplay } from '@/lib/formatTime';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  created_at: string;
  notes?: string;
  order?: number;
  playback_offset_seconds?: number;
};

type TimelineProps = {
  labels: Label[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onPlayFromTimestamp: (timestamp: number) => void;
};

export const Timeline = ({ labels, currentTime, duration, onSeek, onPlayFromTimestamp }: TimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  // Handle marker click
  const handleMarkerClick = (e: React.MouseEvent, label: Label) => {
    e.stopPropagation();
    onPlayFromTimestamp(label.timestamp_seconds);
  };

  // Calculate position percentage for markers and current time
  const getPositionPercentage = (time: number) => {
    if (duration === 0) return 0;
    return Math.min(100, Math.max(0, (time / duration) * 100));
  };

  // Generate time markers for the timeline (every 30 seconds or based on duration)
  const generateTimeMarkers = () => {
    if (duration === 0) return [];
    
    const interval = duration > 300 ? 60 : duration > 120 ? 30 : 15; // 1min, 30s, or 15s intervals
    const markers = [];
    
    for (let time = 0; time <= duration; time += interval) {
      if (time > duration) break;
      markers.push(time);
    }
    
    // Always include the end time
    if (markers[markers.length - 1] !== duration) {
      markers.push(duration);
    }
    
    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  return (
    <TooltipProvider>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Timeline View</h3>
            <Badge variant="secondary">
              {labels.length} marker{labels.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Main Timeline */}
          <div className="relative">
            {/* Timeline Background and Progress */}
            <div 
              ref={timelineRef}
              className="relative h-12 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-250 transition-colors"
              onClick={handleTimelineClick}
            >
              {/* Progress Bar */}
              <div 
                className="absolute top-0 left-0 h-full bg-primary/30 rounded-lg transition-all duration-200"
                style={{ width: `${getPositionPercentage(currentTime)}%` }}
              />
              
              {/* Current Time Indicator */}
              <div 
                className="absolute top-0 w-1 h-full bg-primary rounded-sm transition-all duration-200"
                style={{ left: `${getPositionPercentage(currentTime)}%` }}
              />

              {/* Label Markers */}
              {labels.map((label) => (
                <Tooltip key={label.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-1 w-2 h-10 bg-blue-500 hover:bg-blue-600 rounded-sm cursor-pointer transition-colors shadow-sm z-10"
                      style={{ 
                        left: `${getPositionPercentage(label.timestamp_seconds)}%`,
                        transform: 'translateX(-50%)'
                      }}
                      onClick={(e) => handleMarkerClick(e, label)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-center">
                      <div className="font-medium">{label.label_name}</div>
                      <div className="text-sm text-gray-500">
                        {formatTimeForDisplay(label.timestamp_seconds)}
                      </div>
                      {label.notes && (
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {label.notes.substring(0, 50)}
                          {label.notes.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Time Scale */}
            <div className="relative mt-2 h-6">
              {timeMarkers.map((time) => (
                <div
                  key={time}
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${getPositionPercentage(time)}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="w-px h-2 bg-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">
                    {formatTimeForDisplay(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-primary/30 rounded-sm" />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-sm" />
              <span>Current Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-3 bg-blue-500 rounded-sm" />
              <span>Markers</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-500 italic">
            Click anywhere on the timeline to seek, or click markers to jump to labeled sections
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
