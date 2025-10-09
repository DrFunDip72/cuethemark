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
  urgent: "bg-red-500 hover:bg-red-600",
  high: "bg-orange-500 hover:bg-orange-600",
  medium: "bg-yellow-500 hover:bg-yellow-600",
  low: "bg-blue-500 hover:bg-blue-600",
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
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm line-clamp-1">
                  {feature.title}
                </h4>
                <Badge className={priorityColors[feature.priority]}>
                  {feature.priority}
                </Badge>
              </div>
              {feature.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {feature.description}
                </p>
              )}
              {feature.linked_error_id && (
                <Badge variant="outline" className="text-xs">
                  Bug Fix
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
