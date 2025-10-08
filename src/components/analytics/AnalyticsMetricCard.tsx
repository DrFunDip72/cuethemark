import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  loading?: boolean;
}

export const AnalyticsMetricCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
}: AnalyticsMetricCardProps) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return MinusIcon;
    return change > 0 ? ArrowUpIcon : ArrowDownIcon;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            <TrendIcon className={cn("h-3 w-3", getTrendColor())} />
            <span className={getTrendColor()}>
              {Math.abs(change).toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
