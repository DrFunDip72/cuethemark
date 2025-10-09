import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import type { Feature } from "@/hooks/useFeatures";

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
}

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const statusColors = {
  not_started: "bg-slate-500 text-white",
  in_progress: "bg-blue-500 text-white",
  completed: "bg-green-500 text-white",
};

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export const FeatureCard = ({ feature, onClick }: FeatureCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <button
              className="mt-1 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 space-y-3">
              {/* Title and Status */}
              <div className="space-y-2">
                <h4 className="font-semibold text-base leading-tight">
                  {feature.title}
                </h4>
                <Badge className={`${statusColors[feature.status]} text-xs`}>
                  {statusLabels[feature.status]}
                </Badge>
              </div>

              {/* Description */}
              {feature.description && (
                <div className="p-3 rounded-md border bg-muted/30">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {feature.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span>
                  Created {new Date(feature.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span>•</span>
                <Badge className={priorityColors[feature.priority]} variant="secondary">
                  {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                </Badge>
                {feature.linked_error_id && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs border-destructive text-destructive">
                      Bug Fix
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
