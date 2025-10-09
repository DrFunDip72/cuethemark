import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useFeatures } from "@/hooks/useFeatures";
import { Feature } from "@/hooks/useFeatures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Trash2, Eye } from "lucide-react";
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
import { FeatureDetailDialog } from "@/components/FeatureDetailDialog";

const priorityColors = {
  low: "bg-blue-500 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-orange-500 text-white",
  urgent: "bg-red-500 text-white",
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

export default function ArchivedFeaturesPage() {
  const [archivedFeatures, setArchivedFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const { unarchiveFeature } = useFeatures();

  const fetchArchivedFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .eq("archived", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setArchivedFeatures(data || []);
    } catch (error: any) {
      console.error("Error fetching archived features:", error);
      toast({
        title: "Error",
        description: "Failed to load archived features",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedFeatures();
  }, []);

  const handleUnarchive = async (id: string) => {
    await unarchiveFeature(id);
    setArchivedFeatures(archivedFeatures.filter((f) => f.id !== id));
  };

  const handleDeleteConfirm = async () => {
    if (!featureToDelete) return;

    try {
      const { error } = await supabase
        .from("features")
        .delete()
        .eq("id", featureToDelete);

      if (error) throw error;

      setArchivedFeatures(archivedFeatures.filter((f) => f.id !== featureToDelete));
      toast({
        title: "Success",
        description: "Feature permanently deleted",
      });
    } catch (error: any) {
      console.error("Error deleting feature:", error);
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFeatureToDelete(null);
    }
  };

  const handleViewDetails = (feature: Feature) => {
    setSelectedFeature(feature);
    setDetailDialogOpen(true);
  };

  return (
    <AdminLayout
      title="Archived Features"
      description="View and manage archived feature requests"
    >
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading archived features...
          </div>
        ) : archivedFeatures.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No archived features found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Archived Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">{feature.title}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[feature.status]}>
                      {statusLabels[feature.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[feature.priority]}>
                      {feature.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(feature.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(feature)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(feature.id)}
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFeatureToDelete(feature.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feature. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FeatureDetailDialog
        feature={selectedFeature}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={() => {}}
        onArchive={async () => {}}
        onCreateAnnouncement={() => {}}
      />
    </AdminLayout>
  );
}
