import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AnalyticsTimeRangeSelector, TimeRange, Granularity } from "./AnalyticsTimeRangeSelector";
import { format, parse } from "date-fns";

interface UploadActivityChartProps {
  data: { date: string; tracks: number; labels: number }[];
  loading?: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange?: (date: Date | undefined) => void;
  onCustomEndDateChange?: (date: Date | undefined) => void;
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

export const UploadActivityChart = ({ 
  data, 
  loading = false,
  timeRange,
  onTimeRangeChange,
  granularity,
  onGranularityChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: UploadActivityChartProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const formattedData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Upload Activity Timeline</CardTitle>
            <CardDescription>Tracks and labels created over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Upload Activity Timeline</CardTitle>
            <CardDescription>Tracks and labels created over time</CardDescription>
          </div>
          <AnalyticsTimeRangeSelector
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            granularity={granularity}
            onGranularityChange={onGranularityChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={onCustomStartDateChange}
            onCustomEndDateChange={onCustomEndDateChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={formattedData}>
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
