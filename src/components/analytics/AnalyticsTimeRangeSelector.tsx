import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type TimeRange = "7d" | "30d" | "90d" | "custom";
export type Granularity = "daily" | "weekly" | "monthly";

interface AnalyticsTimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange?: (date: Date | undefined) => void;
  onCustomEndDateChange?: (date: Date | undefined) => void;
}

export const AnalyticsTimeRangeSelector = ({
  timeRange,
  onTimeRangeChange,
  granularity,
  onGranularityChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: AnalyticsTimeRangeSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex gap-2">
        <Button
          variant={timeRange === "7d" ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeRangeChange("7d")}
        >
          Last 7 Days
        </Button>
        <Button
          variant={timeRange === "30d" ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeRangeChange("30d")}
        >
          Last 30 Days
        </Button>
        <Button
          variant={timeRange === "90d" ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeRangeChange("90d")}
        >
          Last 90 Days
        </Button>
        <Button
          variant={timeRange === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeRangeChange("custom")}
        >
          Custom
        </Button>
      </div>

      {timeRange === "custom" && (
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={onCustomStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={onCustomEndDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <Select value={granularity} onValueChange={(value) => onGranularityChange(value as Granularity)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
