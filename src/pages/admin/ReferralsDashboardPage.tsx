import { AdminLayout } from "@/components/AdminLayout";
import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { ReferralBreakdownChart } from "@/components/analytics/ReferralBreakdownChart";
import { TopReferrersTable } from "@/components/analytics/TopReferrersTable";
import { RecentReferralsTimeline } from "@/components/analytics/RecentReferralsTimeline";
import { useReferralMetrics } from "@/hooks/useReferralMetrics";
import { Users, UserPlus, TrendingUp, Award } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ReferralsDashboardPage = () => {
  const { overview, topReferrers, recentReferrals, isLoading, error } = useReferralMetrics();

  if (error) {
    return (
      <AdminLayout
        title="Referrals Dashboard"
        description="View referral data and top referrers"
      >
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load referral data. Please try again later.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const topReferrer = topReferrers?.[0];
  const last7DaysReferrals = recentReferrals?.filter(
    (r) => new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length || 0;

  return (
    <AdminLayout
      title="Referrals Dashboard"
      description="View referral data and top referrers"
    >
      <div className="space-y-6">
        {/* Overview Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsMetricCard
            title="Total Referrals"
            value={overview?.referredUsers || 0}
            icon={UserPlus}
            loading={isLoading}
          />
          <AnalyticsMetricCard
            title="Referral Rate"
            value={`${(overview?.referralRate ?? 0).toFixed(1)}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
          <AnalyticsMetricCard
            title="Top Referrer"
            value={topReferrer?.referrerDisplay || "N/A"}
            icon={Award}
            loading={isLoading}
          />
          <AnalyticsMetricCard
            title="Recent (7d)"
            value={last7DaysReferrals}
            icon={Users}
            loading={isLoading}
          />
        </div>

        {/* Data Quality Notice */}
        {!isLoading && topReferrers && topReferrers.length > 0 && (
          <Alert>
            <AlertDescription>
              Referral data is based on free-text entries. Similar names (e.g., "Justin", "Justin Maxwell") 
              are automatically normalized for accurate counting.
            </AlertDescription>
          </Alert>
        )}

        {/* Charts and Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ReferralBreakdownChart
            referredUsers={overview?.referredUsers || 0}
            organicUsers={overview?.organicUsers || 0}
            loading={isLoading}
          />
          <TopReferrersTable
            referrers={topReferrers || []}
            loading={isLoading}
          />
        </div>

        {/* Recent Referrals Timeline */}
        <RecentReferralsTimeline
          referrals={recentReferrals || []}
          loading={isLoading}
        />
      </div>
    </AdminLayout>
  );
};

export default ReferralsDashboardPage;
