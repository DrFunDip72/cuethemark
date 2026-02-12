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
import type { Feature, FeaturePriority, FeatureStatus } from "@/hooks/useFeatures";

interface CreateFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (feature: Partial<Feature>) => Promise<void>;
  initialData?: Partial<Feature>;
  mode?: "create" | "edit";
}

export const CreateFeatureDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  mode = "create",
}: CreateFeatureDialogProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<FeaturePriority>(
    initialData?.priority || "medium"
  );
  const [status, setStatus] = useState<FeatureStatus>(
    initialData?.status || "not_started"
  );
  const [saving, setSaving] = useState(false);

  // Update state when initialData changes
  React.useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setPriority(initialData?.priority || "medium");
      setStatus(initialData?.status || "not_started");
    }
  }, [initialData, open]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        ...(initialData?.linked_error_id && {
          linked_error_id: initialData.linked_error_id,
        }),
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch (error) {
      console.error("Error saving feature:", error);
    } finally {
      setSaving(false);
    }
  };

  const darkInput = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white placeholder:text-white/50";
  const darkSelectContent = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&_[data-highlighted]]:bg-[hsl(var(--landing-surface-hover))] [&_[data-highlighted]]:text-white";
  const darkSelectTrigger = "border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white [&>svg]:text-white/70";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === "create" ? "Create Feature" : "Edit Feature"}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            {mode === "create"
              ? "Add a new feature to track its development"
              : "Update the feature details"}
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

          {initialData?.linked_error_id && (
            <div className="text-sm text-white/80">
              This feature is linked to a bug report
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface-hover))] text-white hover:bg-[hsl(var(--landing-border))] hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving} style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}>
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
