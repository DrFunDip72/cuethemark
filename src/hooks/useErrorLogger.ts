import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type ErrorType = 
  | 'validation' 
  | 'storage' 
  | 'database' 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'api' 
  | 'edge_function' 
  | 'unknown';

interface ErrorContext {
  component: string;
  action: string;
  url?: string;
  userAgent?: string;
  requestId?: string;
  additionalContext?: Record<string, any>;
}

interface LoggedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  step: string;
  originalError?: unknown;
  context: ErrorContext;
}

export const useErrorLogger = () => {
  const { user } = useAuth();

  const logError = async (error: LoggedError) => {
    // Log to console for development
    console.error(`[${error.context.component}] ${error.context.action}:`, {
      type: error.type,
      message: error.message,
      step: error.step,
      context: error.context,
      originalError: error.originalError,
    });

    // Prepare error data for database
    const errorData = {
      error_type: error.type,
      error_message: error.message,
      step_failed: error.step,
      component: error.context.component,
      action: error.context.action,
      url: error.context.url || window.location.href,
      user_agent: error.context.userAgent || navigator.userAgent,
      request_id: error.context.requestId,
      user_id: user?.id || null,
      stack_trace: error.originalError instanceof Error ? error.originalError.stack : null,
      context: {
        ...error.context.additionalContext,
        timestamp: new Date().toISOString(),
      },
    };

    // Insert error into database
    try {
      const { error: dbError } = await supabase
        .from('application_errors')
        .insert(errorData);

      if (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
    } catch (err) {
      console.error('Exception logging error to database:', err);
    }

    // Show user-friendly toast notification
    toast({
      title: 'Error',
      description: error.userMessage,
      variant: 'destructive',
    });
  };

  return { logError };
};
