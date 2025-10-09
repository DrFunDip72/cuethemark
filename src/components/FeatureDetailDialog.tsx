import { useState } from "react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Archive, Bell } from "lucide-react";
import type { Feature, FeaturePriority, FeatureStatus } from "@/hooks/useFeatures";

interface FeatureDetailDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Feature>) => Promise<any>;
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
  onSave,
  onArchive,
  onCreateAnnouncement,
}: FeatureDetailDialogProps) => {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [title, setTitle] = useState(feature?.title || "");
  const [description, setDescription] = useState(feature?.description || "");
  const [priority, setPriority] = useState<FeaturePriority>(feature?.priority || "medium");
  const [status, setStatus] = useState<FeatureStatus>(feature?.status || "not_started");
  const [saving, setSaving] = useState(false);

  // Update state when feature changes
  React.useEffect(() => {
    if (feature && open) {
      setTitle(feature.title);
      setDescription(feature.description || "");
      setPriority(feature.priority);
      setStatus(feature.status);
    }
  }, [feature, open]);

  const handleSave = async () => {
    if (!feature || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(feature.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving feature:", error);
    } finally {
      setSaving(false);
    }
  };

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Details</DialogTitle>
            <DialogDescription>
              View and edit feature information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter feature title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the feature and its benefits"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as FeaturePriority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FeatureStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {feature.linked_error_id && (
              <div className="text-sm text-muted-foreground">
                This feature is linked to a bug report
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">
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
                  <p className="text-base">
                    {new Date(feature.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

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

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
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
