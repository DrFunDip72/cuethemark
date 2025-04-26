
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Label = {
  id: string;
  label_name: string;
  timestamp_seconds: number;
  created_at: string;
};

type LabelListProps = {
  labels: Label[];
  currentTime: number;
  onPlayFromTimestamp: (timestamp: number) => void;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const LabelList = ({ labels, currentTime, onPlayFromTimestamp }: LabelListProps) => {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    const currentLabel = labels.find(
      (label) => currentTime >= label.timestamp_seconds && 
      (currentTime < (labels.find(l => l.timestamp_seconds > label.timestamp_seconds)?.timestamp_seconds || Infinity))
    );
    setActiveLabel(currentLabel?.id || null);
  }, [currentTime, labels]);

  return (
    <div className="space-y-3">
      {labels.map((label) => (
        <Card
          key={label.id}
          className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
            activeLabel === label.id ? 'border-primary' : ''
          }`}
          onClick={() => {
            const startTime = Math.max(0, label.timestamp_seconds - 3);
            onPlayFromTimestamp(startTime);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-4 w-4 text-primary" />
              <div>
                <h3 className="font-medium">{label.label_name}</h3>
                <Badge variant="secondary">
                  {formatTime(label.timestamp_seconds)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
