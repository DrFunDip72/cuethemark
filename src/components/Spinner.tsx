import { cn } from '@/lib/utils';

export const Spinner = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div className={cn('flex items-center justify-center', fullScreen ? 'min-h-screen' : 'py-16')}>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);
