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
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">
                  {feature.title}
                </DialogTitle>
                <DialogDescription>
                  Created {new Date(feature.created_at).toLocaleDateString()}
                  {feature.completed_at &&
                    ` • Completed ${new Date(feature.completed_at).toLocaleDateString()}`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[feature.priority]}>
                  {feature.priority}
                </Badge>
                <Badge variant="outline">{statusLabels[feature.status]}</Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {feature.description && (
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feature.description}
                </p>
              </div>
            )}

            {feature.linked_error_id && (
              <div>
                <Badge variant="outline">Bug Fix Feature</Badge>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            {feature.status === "completed" && (
              <Button
                size="sm"
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
