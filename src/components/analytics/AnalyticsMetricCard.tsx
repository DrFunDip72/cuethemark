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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
          {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-6 w-16 bg-muted animate-pulse rounded" />
          {change !== undefined && (
            <div className="h-3 w-20 bg-muted animate-pulse rounded mt-1" />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-0.5">
            <TrendIcon className={cn("h-2.5 w-2.5", getTrendColor())} />
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
