import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, endOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { Granularity, TimeRange } from "@/components/analytics/AnalyticsTimeRangeSelector";

interface UserGrowthData {
  date: string;
  count: number;
}

interface UserGrowthMetrics {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  growthRate: number;
  chartData: UserGrowthData[];
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
  data: { created_at: string }[],
  granularity: Granularity,
  start: Date,
  end: Date
): UserGrowthData[] => {
  const dataMap = new Map<string, number>();

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
    dataMap.set(key, 0);
  });

  // Count actual data
  data.forEach((item) => {
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

    dataMap.set(key, (dataMap.get(key) || 0) + 1);
  });

  return Array.from(dataMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const useUserGrowthData = (
  timeRange: TimeRange,
  granularity: Granularity,
  customStartDate?: Date,
  customEndDate?: Date
) => {
  return useQuery({
    queryKey: ["user-growth", timeRange, granularity, customStartDate, customEndDate],
    queryFn: async (): Promise<UserGrowthMetrics> => {
      const { start, end } = getDateRange(timeRange, customStartDate, customEndDate);

      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get users in time range for chart
      const { data: usersInRange } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at");

      // Get users from last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      const { count: newUsersLast7Days } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Get users from last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { count: newUsersLast30Days } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Calculate growth rate (comparing last 7 days to previous 7 days)
      const fourteenDaysAgo = subDays(new Date(), 14);
      const { count: previousWeekUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fourteenDaysAgo.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString());

      const growthRate =
        previousWeekUsers && previousWeekUsers > 0
          ? ((newUsersLast7Days || 0) - previousWeekUsers) / previousWeekUsers * 100
          : 0;

      const chartData = groupDataByGranularity(usersInRange || [], granularity, start, end);

      return {
        totalUsers: totalUsers || 0,
        newUsersLast7Days: newUsersLast7Days || 0,
        newUsersLast30Days: newUsersLast30Days || 0,
        growthRate,
        chartData,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
