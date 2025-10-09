import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Archive as ArchiveIcon } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useFeatures, type Feature, type FeatureStatus } from "@/hooks/useFeatures";
import { FeatureCard } from "@/components/FeatureCard";
import { CreateFeatureDialog } from "@/components/CreateFeatureDialog";
import { FeatureDetailDialog } from "@/components/FeatureDetailDialog";

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

const FeatureTrackerPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { features, loading, createFeature, updateFeature, archiveFeature, moveFeature } =
    useFeatures();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [featureFromError, setFeatureFromError] = useState<{
    errorId: string;
    errorMsg: string;
  } | null>(null);

  useEffect(() => {
    const createFeature = searchParams.get("createFeature");
    const errorId = searchParams.get("errorId");
    const errorMsg = searchParams.get("errorMsg");

    if (createFeature === "true" && errorId && errorMsg) {
      setFeatureFromError({ errorId, errorMsg });
      setCreateDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getFeaturesByStatus = (status: FeatureStatus) =>
    features.filter((f) => f.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeFeature = features.find((f) => f.id === active.id);
    if (!activeFeature) return;

    const overId = over.id as string;
    let newStatus: FeatureStatus = activeFeature.status;

    // Check if dropped on a column container
    if (["not_started", "in_progress", "completed"].includes(overId)) {
      newStatus = overId as FeatureStatus;
    } else {
      // Check if dropped on another feature card
      const overFeature = features.find((f) => f.id === overId);
      if (overFeature) {
        newStatus = overFeature.status;
      }
    }

    if (activeFeature.status !== newStatus) {
      const featuresInNewStatus = getFeaturesByStatus(newStatus);
      const newOrderIndex = featuresInNewStatus.length;
      
      // Update locally first for immediate feedback
      await moveFeature(activeFeature.id, newStatus, newOrderIndex);

      if (newStatus === "completed") {
        handleCreateAnnouncement(activeFeature);
      }
    }
  };

  const handleCreateAnnouncement = (feature: Feature) => {
    navigate("/app/admin/notifications", {
      state: {
        featureId: feature.id,
        prefilledTitle: `New Feature: ${feature.title}`,
        prefilledContent: feature.description
          ? `We're excited to announce: ${feature.title}\n\n${feature.description}`
          : `We're excited to announce: ${feature.title}`,
      },
    });
  };

  const activeFeature = activeId ? features.find((f) => f.id === activeId) : null;

  const statusColumns: { status: FeatureStatus; title: string; description: string }[] = [
    { status: "not_started", title: "Not Started", description: "Planned features" },
    { status: "in_progress", title: "In Progress", description: "Currently working on" },
    { status: "completed", title: "Completed", description: "Ready to announce" },
  ];

  return (
    <AdminLayout
      title="Feature Tracker"
      description="Manage feature development with kanban board"
      action={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/app/admin/features/archived")}
          >
            <ArchiveIcon className="h-4 w-4 mr-2" />
            Archived
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Feature
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="text-center py-12">Loading features...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {statusColumns.map((column) => {
              const columnFeatures = getFeaturesByStatus(column.status);
              return (
                <Card key={column.status}>
                  <CardHeader>
                    <CardTitle>{column.title}</CardTitle>
                    <CardDescription>
                      {column.description} ({columnFeatures.length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DroppableColumn id={column.status}>
                      <SortableContext
                        id={column.status}
                        items={columnFeatures.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 min-h-[200px]">
                          {columnFeatures.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              No features
                            </div>
                          ) : (
                            columnFeatures.map((feature) => (
                              <FeatureCard
                                key={feature.id}
                                feature={feature}
                                onClick={() => setSelectedFeature(feature)}
                              />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </DroppableColumn>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DragOverlay>
            {activeFeature && (
              <FeatureCard feature={activeFeature} onClick={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <CreateFeatureDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setFeatureFromError(null);
        }}
        onSave={async (feature) => {
          await createFeature({
            title: feature.title!,
            description: feature.description || null,
            priority: feature.priority!,
            status: feature.status || "not_started",
            linked_error_id: feature.linked_error_id || null,
          });
          setFeatureFromError(null);
        }}
        initialData={
          featureFromError
            ? {
                title: `Fix: ${featureFromError.errorMsg}`,
                linked_error_id: featureFromError.errorId,
              }
            : undefined
        }
      />

      <CreateFeatureDialog
        open={!!editingFeature}
        onOpenChange={(open) => !open && setEditingFeature(null)}
        onSave={async (updates) => {
          if (editingFeature) {
            await updateFeature(editingFeature.id, updates);
            setEditingFeature(null);
            setSelectedFeature(null);
          }
        }}
        initialData={editingFeature || undefined}
        mode="edit"
      />

      <FeatureDetailDialog
        feature={selectedFeature}
        open={!!selectedFeature}
        onOpenChange={(open) => !open && setSelectedFeature(null)}
        onSave={updateFeature}
        onArchive={archiveFeature}
        onCreateAnnouncement={handleCreateAnnouncement}
      />
    </AdminLayout>
  );
};

export default FeatureTrackerPage;
