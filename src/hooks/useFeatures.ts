import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type FeaturePriority = "low" | "medium" | "high" | "urgent";
export type FeatureStatus = "not_started" | "in_progress" | "completed";

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  priority: FeaturePriority;
  status: FeatureStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  order_index: number;
  linked_error_id: string | null;
}

export const useFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async (includeArchived = false) => {
    try {
      let query = supabase
        .from("features")
        .select("*");
      
      if (!includeArchived) {
        query = query.eq("archived", false);
      }
      
      const { data, error } = await query.order("order_index", { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      console.error("Error fetching features:", error);
      toast({
        title: "Error",
        description: "Failed to load features",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const createFeature = async (
    feature: Omit<Feature, "id" | "created_at" | "updated_at" | "completed_at" | "order_index" | "created_by">
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const maxOrder = features
        .filter((f) => f.status === feature.status)
        .reduce((max, f) => Math.max(max, f.order_index), -1);

      const { data, error } = await supabase
        .from("features")
        .insert({
          ...feature,
          created_by: user?.id,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setFeatures([...features, data]);
      toast({ title: "Success", description: "Feature created successfully" });
      return data;
    } catch (error: any) {
      console.error("Error creating feature:", error);
      toast({
        title: "Error",
        description: "Failed to create feature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFeature = async (id: string, updates: Partial<Feature>) => {
    try {
      const { data, error } = await supabase
        .from("features")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setFeatures(features.map((f) => (f.id === id ? data : f)));
      toast({ title: "Success", description: "Feature updated successfully" });
      return data;
    } catch (error: any) {
      console.error("Error updating feature:", error);
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFeature = async (id: string) => {
    try {
      const { error } = await supabase.from("features").delete().eq("id", id);

      if (error) throw error;

      setFeatures(features.filter((f) => f.id !== id));
      toast({ title: "Success", description: "Feature deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting feature:", error);
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    }
  };

  const moveFeature = async (
    featureId: string,
    newStatus: FeatureStatus,
    newOrderIndex: number
  ) => {
    try {
      const updates: Partial<Feature> = {
        status: newStatus,
        order_index: newOrderIndex,
      };

      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      await updateFeature(featureId, updates);
    } catch (error) {
      console.error("Error moving feature:", error);
    }
  };

  const archiveFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from("features")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;

      setFeatures(features.filter((f) => f.id !== id));
      toast({ title: "Success", description: "Feature archived successfully" });
    } catch (error: any) {
      console.error("Error archiving feature:", error);
      toast({
        title: "Error",
        description: "Failed to archive feature",
        variant: "destructive",
      });
    }
  };

  const unarchiveFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from("features")
        .update({ archived: false })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Feature unarchived successfully" });
    } catch (error: any) {
      console.error("Error unarchiving feature:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive feature",
        variant: "destructive",
      });
    }
  };

  return {
    features,
    loading,
    createFeature,
    updateFeature,
    deleteFeature,
    moveFeature,
    archiveFeature,
    unarchiveFeature,
    refetch: fetchFeatures,
  };
};
