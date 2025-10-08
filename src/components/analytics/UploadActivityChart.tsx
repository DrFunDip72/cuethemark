import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface UploadActivityChartProps {
  data: { date: string; tracks: number; labels: number }[];
  loading?: boolean;
}

const chartConfig = {
  tracks: {
    label: "Tracks",
    color: "hsl(var(--primary))",
  },
  labels: {
    label: "Labels",
    color: "hsl(var(--chart-2))",
  },
};

export const UploadActivityChart = ({ data, loading = false }: UploadActivityChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Activity Timeline</CardTitle>
          <CardDescription>Tracks and labels created over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Activity Timeline</CardTitle>
        <CardDescription>Tracks and labels created over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="tracks"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="labels"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
