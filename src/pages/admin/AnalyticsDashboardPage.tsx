import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AnalyticsTimeRangeSelector, TimeRange, Granularity } from "@/components/analytics/AnalyticsTimeRangeSelector";
import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { UserGrowthChart } from "@/components/analytics/UserGrowthChart";
import { UploadActivityChart } from "@/components/analytics/UploadActivityChart";
import { useUserGrowthData } from "@/hooks/useUserGrowthData";
import { useUploadActivityData } from "@/hooks/useUploadActivityData";
import { Users, TrendingUp, Music, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AnalyticsDashboardPage = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const { data: userGrowth, isLoading: userGrowthLoading } = useUserGrowthData(
    timeRange,
    granularity,
    customStartDate,
    customEndDate
  );

  const { data: uploadActivity, isLoading: uploadActivityLoading } = useUploadActivityData(
    timeRange,
    granularity,
    customStartDate,
    customEndDate
  );

  return (
    <AdminLayout
      title="Analytics Dashboard"
      description="Track user growth, uploads, and engagement metrics"
    >
      <div className="space-y-6">
        <AnalyticsTimeRangeSelector
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />

        {/* User Growth Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">User Growth</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsMetricCard
              title="Total Users"
              value={userGrowth?.totalUsers.toLocaleString() || "0"}
              icon={Users}
              loading={userGrowthLoading}
            />
            <AnalyticsMetricCard
              title="New Users (7d)"
              value={userGrowth?.newUsersLast7Days.toLocaleString() || "0"}
              change={userGrowth?.growthRate}
              changeLabel="vs previous week"
              icon={TrendingUp}
              loading={userGrowthLoading}
            />
            <AnalyticsMetricCard
              title="New Users (30d)"
              value={userGrowth?.newUsersLast30Days.toLocaleString() || "0"}
              icon={Users}
              loading={userGrowthLoading}
            />
            <AnalyticsMetricCard
              title="Growth Rate"
              value={`${userGrowth?.growthRate.toFixed(1) || "0"}%`}
              icon={TrendingUp}
              loading={userGrowthLoading}
            />
          </div>
          <UserGrowthChart
            data={userGrowth?.chartData || []}
            loading={userGrowthLoading}
          />
        </div>

        {/* Upload Activity Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Upload Activity</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnalyticsMetricCard
              title="Total Tracks"
              value={uploadActivity?.totalTracks.toLocaleString() || "0"}
              icon={Music}
              loading={uploadActivityLoading}
            />
            <AnalyticsMetricCard
              title="Total Labels"
              value={uploadActivity?.totalLabels.toLocaleString() || "0"}
              icon={Tag}
              loading={uploadActivityLoading}
            />
            <AnalyticsMetricCard
              title="Avg Labels/Track"
              value={uploadActivity?.averageLabelsPerTrack.toFixed(1) || "0"}
              loading={uploadActivityLoading}
            />
            <AnalyticsMetricCard
              title="Active Uploaders"
              value={uploadActivity?.topUploaders.length.toLocaleString() || "0"}
              loading={uploadActivityLoading}
            />
          </div>
          <UploadActivityChart
            data={uploadActivity?.chartData || []}
            loading={uploadActivityLoading}
          />

          {/* Top Uploaders */}
          <Card>
            <CardHeader>
              <CardTitle>Top Uploaders</CardTitle>
              <CardDescription>Most active users in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadActivityLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : uploadActivity?.topUploaders && uploadActivity.topUploaders.length > 0 ? (
                <div className="space-y-2">
                  {uploadActivity.topUploaders.map((uploader, index) => (
                    <div
                      key={uploader.user_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {uploader.display_name || uploader.email}
                          </p>
                          {uploader.display_name && (
                            <p className="text-sm text-muted-foreground">{uploader.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{uploader.count}</p>
                        <p className="text-xs text-muted-foreground">tracks</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No upload activity in the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboardPage;
