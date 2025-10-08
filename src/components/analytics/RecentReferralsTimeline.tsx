import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { RecentReferral } from "@/hooks/useReferralMetrics";
import { formatDistanceToNow } from "date-fns";

interface RecentReferralsTimelineProps {
  referrals: RecentReferral[];
  loading?: boolean;
}

export const RecentReferralsTimeline = ({ referrals, loading = false }: RecentReferralsTimelineProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Latest users who signed up via referral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
        <CardDescription>Latest users who signed up via referral</CardDescription>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent referrals
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral, index) => (
              <div
                key={`${referral.email}-${index}`}
                className="flex items-start gap-3 pb-4 border-b last:border-0"
              >
                <div className="mt-1">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {referral.displayName || referral.email}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Referred by <span className="font-medium text-foreground">{referral.referredBy}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
