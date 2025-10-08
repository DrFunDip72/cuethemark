import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, endOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { Granularity, TimeRange } from "@/components/analytics/AnalyticsTimeRangeSelector";

interface UploadActivityData {
  date: string;
  tracks: number;
  labels: number;
}

interface TopUploader {
  user_id: string;
  email: string;
  display_name: string | null;
  count: number;
}

interface UploadActivityMetrics {
  totalTracks: number;
  totalLabels: number;
  averageLabelsPerTrack: number;
  topUploaders: TopUploader[];
  chartData: UploadActivityData[];
}

const getDateRange = (
  timeRange: TimeRange,
  customStartDate?: Date,
  customEndDate?: Date
): { start: Date; end: Date } => {
  const end = new Date();
  let start: Date;

  switch (timeRange) {
    case "7d":
      start = subDays(end, 7);
      break;
    case "30d":
      start = subDays(end, 30);
      break;
    case "90d":
      start = subDays(end, 90);
      break;
    case "custom":
      start = customStartDate || subDays(end, 30);
      end.setTime(customEndDate?.getTime() || end.getTime());
      break;
    default:
      start = subDays(end, 30);
  }

  return { start: startOfDay(start), end: endOfDay(end) };
};

const groupDataByGranularity = (
  tracks: { created_at: string }[],
  labels: { created_at: string }[],
  granularity: Granularity,
  start: Date,
  end: Date
): UploadActivityData[] => {
  const dataMap = new Map<string, { tracks: number; labels: number }>();

  // Initialize all periods with 0
  let periods: Date[];
  let formatString: string;

  switch (granularity) {
    case "daily":
      periods = eachDayOfInterval({ start, end });
      formatString = "yyyy-MM-dd";
      break;
    case "weekly":
      periods = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      formatString = "yyyy-'W'ww";
      break;
    case "monthly":
      periods = eachMonthOfInterval({ start, end });
      formatString = "yyyy-MM";
      break;
  }

  periods.forEach((period) => {
    const key = format(period, formatString);
    dataMap.set(key, { tracks: 0, labels: 0 });
  });

  // Count tracks
  tracks.forEach((item) => {
    const date = new Date(item.created_at);
    let key: string;

    switch (granularity) {
      case "daily":
        key = format(date, "yyyy-MM-dd");
        break;
      case "weekly":
        key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-'W'ww");
        break;
      case "monthly":
        key = format(startOfMonth(date), "yyyy-MM");
        break;
    }

    const current = dataMap.get(key) || { tracks: 0, labels: 0 };
    dataMap.set(key, { ...current, tracks: current.tracks + 1 });
  });

  // Count labels
  labels.forEach((item) => {
    const date = new Date(item.created_at);
    let key: string;

    switch (granularity) {
      case "daily":
        key = format(date, "yyyy-MM-dd");
        break;
      case "weekly":
        key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-'W'ww");
        break;
      case "monthly":
        key = format(startOfMonth(date), "yyyy-MM");
        break;
    }

    const current = dataMap.get(key) || { tracks: 0, labels: 0 };
    dataMap.set(key, { ...current, labels: current.labels + 1 });
  });

  return Array.from(dataMap.entries())
    .map(([date, { tracks, labels }]) => ({ date, tracks, labels }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const useUploadActivityData = (
  timeRange: TimeRange,
  granularity: Granularity,
  customStartDate?: Date,
  customEndDate?: Date
) => {
  return useQuery({
    queryKey: ["upload-activity", timeRange, granularity, customStartDate, customEndDate],
    queryFn: async (): Promise<UploadActivityMetrics> => {
      const { start, end } = getDateRange(timeRange, customStartDate, customEndDate);

      // Get total tracks
      const { count: totalTracks } = await supabase
        .from("audio_tracks")
        .select("*", { count: "exact", head: true });

      // Get total labels
      const { count: totalLabels } = await supabase
        .from("audio_labels")
        .select("*", { count: "exact", head: true });

      // Get tracks in time range
      const { data: tracksInRange } = await supabase
        .from("audio_tracks")
        .select("created_at, user_id")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at");

      // Get labels in time range
      const { data: labelsInRange } = await supabase
        .from("audio_labels")
        .select("created_at, user_id")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at");

      // Calculate average labels per track
      const averageLabelsPerTrack =
        totalTracks && totalTracks > 0 ? (totalLabels || 0) / totalTracks : 0;

      // Get top uploaders (by track count)
      const userTrackCounts = new Map<string, number>();
      tracksInRange?.forEach((track) => {
        if (track.user_id) {
          userTrackCounts.set(track.user_id, (userTrackCounts.get(track.user_id) || 0) + 1);
        }
      });

      const topUserIds = Array.from(userTrackCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

      // Fetch user details for top uploaders
      const { data: topUploaderProfiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", topUserIds);

      const topUploaders: TopUploader[] = topUserIds
        .map((userId) => {
          const profile = topUploaderProfiles?.find((p) => p.user_id === userId);
          return {
            user_id: userId,
            email: profile?.email || "Unknown",
            display_name: profile?.display_name || null,
            count: userTrackCounts.get(userId) || 0,
          };
        })
        .filter((uploader) => uploader.count > 0);

      const chartData = groupDataByGranularity(
        tracksInRange || [],
        labelsInRange || [],
        granularity,
        start,
        end
      );

      return {
        totalTracks: totalTracks || 0,
        totalLabels: totalLabels || 0,
        averageLabelsPerTrack,
        topUploaders,
        chartData,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
