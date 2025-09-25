'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  FileText,
  Mail,
  Calendar,
  Users,
} from 'lucide-react';
import { useSyncStatus } from '@/hooks/use-integrations';
import type { SyncJob } from '@/types/integrations';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SyncStatusProps {
  connectorId: string;
}

export function SyncStatus({ connectorId }: SyncStatusProps) {
  const { data: syncJob, isLoading } = useSyncStatus(connectorId);
  
  if (isLoading || !syncJob) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getProgress = () => {
    if (!syncJob.items_processed || !syncJob.items_processed) return 0;
    if (syncJob.status !== 'running') return 100;
    
    // Estimate progress (in real implementation, this would be more accurate)
    const startTime = new Date(syncJob.started_at).getTime();
    const now = Date.now();
    const elapsed = now - startTime;
    const estimatedDuration = 5 * 60 * 1000; // 5 minutes
    
    return Math.min(95, (elapsed / estimatedDuration) * 100);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sync Status</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(syncJob.status)}
            <Badge variant={getStatusBadgeVariant(syncJob.status)}>
              {syncJob.status}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Started {format(new Date(syncJob.started_at), 'MMM d, h:mm a')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncJob.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}
        
        {syncJob.status === 'completed' && syncJob.completed_at && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>
                {Math.round(
                  (new Date(syncJob.completed_at).getTime() - new Date(syncJob.started_at).getTime()) / 1000
                )}s
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Processed</span>
                </div>
                <p className="text-2xl font-semibold">{syncJob.items_processed || 0}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  <span>Synced</span>
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  {(syncJob.items_created || 0) + (syncJob.items_updated || 0)}
                </p>
              </div>
            </div>
            
            {syncJob.items_failed && syncJob.items_failed > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-400">
                    {syncJob.items_failed} items failed to sync
                  </p>
                  {syncJob.error_message && (
                    <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                      {syncJob.error_message}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Sync Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="font-medium">{syncJob.items_created || 0} new</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Contacts:</span>
                  <span className="font-medium">{syncJob.items_updated || 0} updated</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {syncJob.status === 'failed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-400">
                  Sync failed
                </p>
                {syncJob.error_message && (
                  <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                    {syncJob.error_message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}