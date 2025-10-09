import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Pencil, Trash2, Megaphone } from "lucide-react";
import type { Feature } from "@/hooks/useFeatures";

interface FeatureDetailDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
  onCreateAnnouncement: (feature: Feature) => void;
}

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const statusColors = {
  not_started: "bg-muted text-muted-foreground",
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
  onDelete,
  onCreateAnnouncement,
}: FeatureDetailDialogProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!feature) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(feature.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{feature.title}</DialogTitle>
            <DialogDescription className="text-base">
              Created {new Date(feature.created_at).toLocaleDateString()}
              {feature.completed_at &&
                ` • Completed ${new Date(feature.completed_at).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase">Priority</div>
                <Badge className={priorityColors[feature.priority]}>
                  {feature.priority}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase">Status</div>
                <Badge className={statusColors[feature.status]}>
                  {statusLabels[feature.status]}
                </Badge>
              </div>
              {feature.linked_error_id && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase">Type</div>
                  <Badge variant="outline">Bug Fix</Badge>
                </div>
              )}
            </div>

            {feature.description && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Description</h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-primary pl-4">
                  {feature.description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            {feature.status === "completed" && (
              <Button
                onClick={() => onCreateAnnouncement(feature)}
                className="flex-1"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              feature "{feature.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
