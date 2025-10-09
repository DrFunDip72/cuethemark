import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Edit, Archive, Bell } from "lucide-react";
import type { Feature } from "@/hooks/useFeatures";

interface FeatureDetailDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onArchive: (id: string) => Promise<void>;
  onCreateAnnouncement: (feature: Feature) => void;
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

export const FeatureDetailDialog = ({
  feature,
  open,
  onOpenChange,
  onEdit,
  onArchive,
  onCreateAnnouncement,
}: FeatureDetailDialogProps) => {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    if (!feature) return;
    setArchiving(true);
    await onArchive(feature.id);
    setArchiving(false);
    setShowArchiveDialog(false);
    onOpenChange(false);
  };

  if (!feature) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="space-y-4">
            {/* Title and Status */}
            <div className="space-y-3">
              <DialogTitle className="text-3xl font-bold leading-tight">
                {feature.title}
              </DialogTitle>
              <Badge className={`${statusColors[feature.status]} w-fit`}>
                {statusLabels[feature.status]}
              </Badge>
            </div>

            {/* Description */}
            {feature.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Description
                </h4>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-base leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base font-semibold">
                  {new Date(feature.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {feature.completed_at && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-base font-semibold">
                    {new Date(feature.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <Badge className={priorityColors[feature.priority]}>
                  {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                </Badge>
              </div>

              {feature.linked_error_id && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline" className="border-destructive text-destructive">
                    Bug Fix
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Action Button for Announcement */}
          {feature.status === "completed" && (
            <div className="pt-4 border-t">
              <Button 
                onClick={() => onCreateAnnouncement(feature)}
                className="w-full"
                size="lg"
              >
                <Bell className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          )}

          {/* Footer with Edit and Archive */}
          <DialogFooter className="pt-4 border-t">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-3 h-3 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveDialog(true)}
              >
                <Archive className="w-3 h-3 mr-2" />
                Archive
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{feature.title}"? You can restore it later from the archived features page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
