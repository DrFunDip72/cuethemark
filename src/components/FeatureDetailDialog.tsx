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

  const darkInput = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white placeholder:text-white/50";
  const darkSelectContent = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&_[data-highlighted]]:bg-[hsl(var(--landing-surface-hover))] [&_[data-highlighted]]:text-white";
  const darkSelectTrigger = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white [&>svg]:text-white/70";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Feature Details</DialogTitle>
            <DialogDescription className="text-white/80">
              View and edit feature information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter feature title"
                className={darkInput}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the feature and its benefits"
                rows={4}
                className={darkInput}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-white">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as FeaturePriority)}>
                  <SelectTrigger id="priority" className={darkSelectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={darkSelectContent}>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FeatureStatus)}>
                  <SelectTrigger id="status" className={darkSelectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={darkSelectContent}>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {feature.linked_error_id && (
              <div className="text-sm text-white/80">
                This feature is linked to a bug report
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80">Created</p>
                <p className="text-base text-white">
                  {new Date(feature.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {feature.completed_at && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Completed</p>
                  <p className="text-base text-white">
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
            <div className="pt-4 border-t border-[hsl(var(--landing-border))]">
              <Button 
                onClick={() => onCreateAnnouncement(feature)}
                className="w-full"
                size="lg"
                style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
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
              className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving} style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Archive Feature</AlertDialogTitle>
            <AlertDialogDescription className="text-white/80">
              Are you sure you want to archive "{feature.title}"? You can restore it later from the archived features page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiving}
              style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
            >
              {archiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
