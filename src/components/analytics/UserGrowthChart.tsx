import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AnalyticsTimeRangeSelector, TimeRange, Granularity } from "./AnalyticsTimeRangeSelector";
import { format, parse } from "date-fns";

interface UserGrowthChartProps {
  data: { date: string; count: number }[];
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
  count: {
    label: "New Users",
    color: "hsl(var(--primary))",
  },
};

export const UserGrowthChart = ({ 
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
}: UserGrowthChartProps) => {
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
            <CardTitle>User Growth Timeline</CardTitle>
            <CardDescription>New user signups over time</CardDescription>
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
            <CardTitle>User Growth Timeline</CardTitle>
            <CardDescription>New user signups over time</CardDescription>
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
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
