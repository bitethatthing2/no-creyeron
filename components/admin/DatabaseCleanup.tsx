'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
  MessageSquare,
  Bell,
  FileX,
  Clock
} from 'lucide-react';
import { useCleanup, type CleanupResponse } from '@/lib/hooks/useCleanup';
import { cn } from '@/lib/utils';

export function DatabaseCleanup() {
  const { runCleanup, isLoading, error } = useCleanup();
  const [lastResult, setLastResult] = useState<CleanupResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCleanup = async () => {
    setShowConfirmDialog(false);
    
    try {
      const result = await runCleanup();
      setLastResult(result);
      setShowDetails(true);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getItemIcon = (key: string) => {
    if (key.includes('posts')) return <FileX className="h-4 w-4" />;
    if (key.includes('messages')) return <MessageSquare className="h-4 w-4" />;
    if (key.includes('storage')) return <HardDrive className="h-4 w-4" />;
    if (key.includes('notifications')) return <Bell className="h-4 w-4" />;
    if (key.includes('tokens')) return <Database className="h-4 w-4" />;
    return <Trash2 className="h-4 w-4" />;
  };

  const formatLabel = (key: string) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Cleanup
        </CardTitle>
        <CardDescription>
          Remove old posts, messages, and orphaned data to optimize database performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Action Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Cleanup...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Run Database Cleanup
              </>
            )}
          </Button>

          {lastResult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle>Confirm Database Cleanup</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>This action will permanently delete:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Posts older than 48 hours and their media files</li>
                <li>Read messages older than 48 hours</li>
                <li>Unread messages older than 7 days</li>
                <li>Orphaned storage files</li>
                <li>Inactive push tokens (30+ days)</li>
                <li>Old notifications (30+ days)</li>
                <li>Orphaned interactions, comments, and receipts</li>
              </ul>
              <p className="font-semibold text-orange-700 dark:text-orange-400">
                This action cannot be undone!
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCleanup}
                  disabled={isLoading}
                >
                  Yes, Run Cleanup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cleanup Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result Display */}
        {lastResult && lastResult.success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Cleanup Successful</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Total items cleaned: {lastResult.total_items_cleaned}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Completed at: {new Date(lastResult.cleaned_at).toLocaleString()}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Results */}
        {lastResult && showDetails && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Cleanup Details</h4>
            <div className="grid gap-2">
              {Object.entries(lastResult.cleanup_results).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    value > 0 ? "bg-muted/50" : "bg-background"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getItemIcon(key)}
                    <span className="text-sm">{formatLabel(key)}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    value > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>About Database Cleanup</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-sm">
              This cleanup function helps maintain optimal database performance by removing:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>Old content that&apos;s no longer needed</li>
              <li>Orphaned data from deleted records</li>
              <li>Inactive device tokens and old notifications</li>
              <li>Unused storage files to free up space</li>
            </ul>
            <p className="text-sm mt-2">
              Run this cleanup periodically (weekly recommended) during low-traffic hours.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}