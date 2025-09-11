import { Clock, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrialStatusProps {
  subscription: {
    subscription_tier?: string;
    subscription_end?: string;
  } | null;
}

export const TrialStatus = ({ subscription }: TrialStatusProps) => {
  if (!subscription?.subscription_end) return null;

  const endDate = new Date(subscription.subscription_end);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show for expired trials
  if (daysRemaining <= 0) return null;

  // Only show for trial tiers
  if (!subscription.subscription_tier?.includes('Trial') && subscription.subscription_tier !== 'Demo') {
    return null;
  }

  const isUrgent = daysRemaining <= 3;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isUrgent ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-blue-50 dark:bg-blue-950/20'
    }`}>
      {isUrgent ? (
        <Clock className={`h-4 w-4 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
      ) : (
        <CalendarDays className={`h-4 w-4 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
      )}
      <span className={`text-sm font-medium ${
        isUrgent ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'
      }`}>
        {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining in your free trial
      </span>
      {isUrgent && (
        <Badge variant="secondary" className="text-xs">
          Upgrade soon
        </Badge>
      )}
    </div>
  );
};