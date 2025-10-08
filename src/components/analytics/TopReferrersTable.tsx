import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { TopReferrer } from "@/hooks/useReferralMetrics";

interface TopReferrersTableProps {
  referrers: TopReferrer[];
  loading?: boolean;
}

export const TopReferrersTable = ({ referrers, loading = false }: TopReferrersTableProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Users who have referred the most people</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Referrers</CardTitle>
        <CardDescription>Users who have referred the most people</CardDescription>
      </CardHeader>
      <CardContent>
        {referrers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No referrals yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrers.map((referrer, index) => (
                <TableRow key={referrer.referrerNormalized}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      #{index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {referrer.referrerDisplay}
                      {referrer.referralCount >= 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Power Referrer
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {referrer.referralCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {referrer.percentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
