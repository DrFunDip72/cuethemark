import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";

interface ReferralBreakdownChartProps {
  referredUsers: number;
  organicUsers: number;
  loading?: boolean;
}

export const ReferralBreakdownChart = ({
  referredUsers,
  organicUsers,
  loading = false,
}: ReferralBreakdownChartProps) => {
  const data = [
    { name: "Referred Users", value: referredUsers, fill: "hsl(var(--primary))" },
    { name: "Organic Users", value: organicUsers, fill: "hsl(180, 60%, 45%)" },
  ];

  const chartConfig = {
    referred: {
      label: "Referred Users",
      color: "hsl(var(--primary))",
    },
    organic: {
      label: "Organic Users",
      color: "hsl(180, 60%, 45%)",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Acquisition</CardTitle>
          <CardDescription>Referred vs Organic users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Acquisition</CardTitle>
        <CardDescription>Referred vs Organic users</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
