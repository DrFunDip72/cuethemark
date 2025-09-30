import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReferralsDashboardPage = () => {
  return (
    <AdminLayout
      title="Referrals Dashboard"
      description="View referral data and top referrers"
    >
      <Card>
        <CardHeader>
          <CardTitle>Referral Statistics</CardTitle>
          <CardDescription>
            Track who is referring new users to your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Referral tracking coming soon...
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ReferralsDashboardPage;
