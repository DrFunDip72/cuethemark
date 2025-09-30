import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ErrorData {
  id: string;
  error_number: number;
  error_type: string;
  error_message: string;
  created_at: string;
  user_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  step_failed: string;
  stack_trace: string | null;
  context: any;
  user_email?: string;
}

const ErrorDashboardPage = () => {
  const [unresolvedErrors, setUnresolvedErrors] = useState<ErrorData[]>([]);
  const [resolvedErrors, setResolvedErrors] = useState<ErrorData[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const loadErrors = async () => {
    try {
      setLoading(true);

      // Fetch unresolved errors with user email
      const { data: unresolvedData, error: unresolvedError } = await supabase
        .from('upload_errors')
        .select(`
          *,
          profiles!upload_errors_user_id_fkey(email)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (unresolvedError) throw unresolvedError;

      // Fetch resolved errors with user email
      const { data: resolvedData, error: resolvedError } = await supabase
        .from('upload_errors')
        .select(`
          *,
          profiles!upload_errors_user_id_fkey(email)
        `)
        .eq('resolved', true)
        .order('resolved_at', { ascending: false })
        .limit(50);

      if (resolvedError) throw resolvedError;

      // Map the data to include user_email
      const mapErrors = (errors: any[]): ErrorData[] => 
        errors?.map(error => ({
          ...error,
          user_email: error.profiles?.email || 'Unknown User'
        })) || [];

      setUnresolvedErrors(mapErrors(unresolvedData));
      setResolvedErrors(mapErrors(resolvedData));
    } catch (error: any) {
      console.error('Error loading errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load errors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (errorId: string) => {
    try {
      setResolving(errorId);

      const { error } = await supabase
        .from('upload_errors')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', errorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Error marked as resolved',
      });

      setSelectedError(null);
      loadErrors();
    } catch (error: any) {
      console.error('Error resolving error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve error',
        variant: 'destructive',
      });
    } finally {
      setResolving(null);
    }
  };

  useEffect(() => {
    loadErrors();

    // Set up real-time subscription
    const channel = supabase
      .channel('upload_errors_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'upload_errors',
        },
        (payload) => {
          console.log('Error change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Error Detected',
              description: 'A new error has been logged',
              variant: 'destructive',
            });
          }
          
          loadErrors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const ErrorCard = ({ error, showResolveButton = true }: { error: ErrorData; showResolveButton?: boolean }) => (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => setSelectedError(error)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">#{error.error_number}</Badge>
              <Badge variant="secondary">{error.error_type}</Badge>
            </div>
            <CardTitle className="text-base truncate">{error.error_message}</CardTitle>
          </div>
          {error.resolved ? (
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><strong>User:</strong> {error.user_email}</p>
          <p><strong>When:</strong> {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}</p>
          {error.step_failed && <p><strong>Step:</strong> {error.step_failed}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="Error Dashboard"
      description="Monitor and resolve system errors in real-time"
      action={
        <Button onClick={loadErrors} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <Tabs defaultValue="unresolved" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="unresolved">
            Unresolved ({unresolvedErrors.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedErrors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading errors...
              </CardContent>
            </Card>
          ) : unresolvedErrors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">No unresolved errors</p>
                <p className="text-muted-foreground">All systems running smoothly!</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {unresolvedErrors.map((error) => (
                  <ErrorCard key={error.id} error={error} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading resolved errors...
              </CardContent>
            </Card>
          ) : resolvedErrors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No resolved errors yet
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {resolvedErrors.map((error) => (
                  <ErrorCard key={error.id} error={error} showResolveButton={false} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Details Dialog */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Error #{selectedError?.error_number}
              <Badge variant="secondary">{selectedError?.error_type}</Badge>
            </DialogTitle>
            <DialogDescription>
              Occurred {selectedError && formatDistanceToNow(new Date(selectedError.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-6">
              {/* Error Message */}
              <div>
                <h3 className="font-semibold mb-2">Error Message</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedError.error_message}</p>
              </div>

              {/* User Info */}
              <div>
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {selectedError.user_email}</p>
                  <p><strong>User ID:</strong> {selectedError.user_id || 'Unknown'}</p>
                </div>
              </div>

              {/* Error Details */}
              <div>
                <h3 className="font-semibold mb-2">Error Details</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Type:</strong> {selectedError.error_type}</p>
                  <p><strong>Step Failed:</strong> {selectedError.step_failed}</p>
                  <p><strong>Timestamp:</strong> {new Date(selectedError.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* File Info (if available) */}
              {(selectedError.file_name || selectedError.file_size || selectedError.file_type) && (
                <div>
                  <h3 className="font-semibold mb-2">File Information</h3>
                  <div className="text-sm space-y-1">
                    {selectedError.file_name && <p><strong>File Name:</strong> {selectedError.file_name}</p>}
                    {selectedError.file_size && <p><strong>File Size:</strong> {(selectedError.file_size / 1024 / 1024).toFixed(2)} MB</p>}
                    {selectedError.file_type && <p><strong>File Type:</strong> {selectedError.file_type}</p>}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <ScrollArea className="h-40 bg-muted p-3 rounded-md">
                    <pre className="text-xs font-mono">{selectedError.stack_trace}</pre>
                  </ScrollArea>
                </div>
              )}

              {/* Context */}
              {selectedError.context && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Context</h3>
                  <ScrollArea className="h-40 bg-muted p-3 rounded-md">
                    <pre className="text-xs font-mono">{JSON.stringify(selectedError.context, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}

              {/* Resolution Info */}
              {selectedError.resolved && (
                <div>
                  <h3 className="font-semibold mb-2">Resolution</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p><strong>Resolved at:</strong> {selectedError.resolved_at && new Date(selectedError.resolved_at).toLocaleString()}</p>
                    <p><strong>Resolved by:</strong> {selectedError.resolved_by || 'Unknown'}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!selectedError.resolved && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => handleResolve(selectedError.id)}
                    disabled={resolving === selectedError.id}
                  >
                    {resolving === selectedError.id ? 'Resolving...' : 'Mark as Resolved'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ErrorDashboardPage;
