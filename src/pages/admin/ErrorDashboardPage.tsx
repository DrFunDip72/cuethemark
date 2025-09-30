import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ErrorDashboardPage = () => {
  return (
    <AdminLayout
      title="Error Dashboard"
      description="Monitor and resolve upload errors in real-time"
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Upload Errors</CardTitle>
          <CardDescription>
            Real-time monitoring of upload failures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Error dashboard functionality coming soon...
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ErrorDashboardPage;
