
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
  abLoopEnabled?: boolean;
  abLoopStart?: number | null;
  abLoopEnd?: number | null;
};

export const Timeline = ({ 
  labels, 
  currentTime, 
  duration, 
  onSeek, 
  onPlayFromTimestamp,
  abLoopEnabled = false,
  abLoopStart = null,
  abLoopEnd = null 
}: TimelineProps) => {
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
      <Card
        className="p-6"
        style={{
          backgroundColor: "hsl(var(--landing-surface))",
          borderColor: "hsl(var(--landing-border))",
        }}
      >
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Timeline View</h3>
            <Badge
              variant="secondary"
              className="text-white"
              style={{
                backgroundColor: "hsl(var(--landing-surface-hover))",
                borderColor: "hsl(var(--landing-border))",
              }}
            >
              {labels.length} marker{labels.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Main Timeline */}
          <div className="relative">
            {/* Timeline Background and Progress */}
            <div
              ref={timelineRef}
              className="relative h-12 rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: "hsl(var(--landing-border))" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--landing-surface-hover))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--landing-border))";
              }}
              onClick={handleTimelineClick}
            >
              {/* Progress Bar */}
              <div
                className="absolute top-0 left-0 h-full rounded-lg transition-all duration-200"
                style={{
                  width: `${getPositionPercentage(currentTime)}%`,
                  backgroundColor: "hsl(var(--landing-accent) / 0.45)",
                }}
              />
              
              {/* AB Loop Range Overlay */}
              {abLoopEnabled && abLoopStart !== null && abLoopEnd !== null && (
                <>
                  {/* Grayed out area before loop start */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-l-lg"
                    style={{
                      width: `${getPositionPercentage(abLoopStart)}%`,
                      backgroundColor: "hsl(var(--landing-bg) / 0.5)",
                    }}
                  />
                  {/* Grayed out area after loop end */}
                  <div
                    className="absolute top-0 h-full rounded-r-lg"
                    style={{
                      left: `${getPositionPercentage(abLoopEnd)}%`,
                      width: `${100 - getPositionPercentage(abLoopEnd)}%`,
                      backgroundColor: "hsl(var(--landing-bg) / 0.5)",
                    }}
                  />
                  {/* Loop range highlight */}
                  <div 
                    className="absolute top-0 h-full bg-yellow-300/40 border-2 border-yellow-500/60"
                    style={{ 
                      left: `${getPositionPercentage(abLoopStart)}%`,
                      width: `${getPositionPercentage(abLoopEnd) - getPositionPercentage(abLoopStart)}%`
                    }}
                  />
                </>
              )}
              
              {/* Current Time Indicator (playhead) - white for maximum contrast on dark track */}
              <div
                className="absolute top-0 w-2.5 h-full rounded-sm transition-all duration-200 z-20"
                style={{
                  left: `${getPositionPercentage(currentTime)}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: '#fff',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.3)',
                }}
              />

              {/* Label Markers - accent with light border for contrast */}
              {labels.map((label) => (
                <Tooltip key={label.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-1 w-2.5 h-10 rounded-sm cursor-pointer transition-colors z-10 hover:brightness-110"
                      style={{
                        backgroundColor: "hsl(var(--landing-accent))",
                        border: '1.5px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                        left: `${getPositionPercentage(label.timestamp_seconds)}%`,
                        transform: 'translateX(-50%)',
                      }}
                      onClick={(e) => handleMarkerClick(e, label)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-[hsl(var(--landing-surface))] border-[hsl(var(--landing-border))] text-white">
                    <div className="text-center">
                      <div className="font-medium">{label.label_name}</div>
                      <div className="text-sm text-white/80">
                        {formatTimeForDisplay(label.timestamp_seconds)}
                      </div>
                      {label.notes && (
                        <div className="text-xs text-white/70 mt-1 truncate">
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
                  <div className="w-px h-2" style={{ backgroundColor: "hsl(var(--landing-border))" }} />
                  <span className="text-xs text-white mt-1">
                    {formatTimeForDisplay(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--landing-accent) / 0.45)" }} />
              <span>Played</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-3 rounded-sm bg-white shadow-sm" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.3)' }} />
              <span>Current Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-3 rounded-sm border border-white/50" style={{ backgroundColor: "hsl(var(--landing-accent))" }} />
              <span>Markers</span>
            </div>
            {abLoopEnabled && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-yellow-300 border border-yellow-500 rounded-sm" />
                <span>AB Loop Range</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-white/80 italic">
            Click anywhere on the timeline to seek, or click markers to jump to labeled sections
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
