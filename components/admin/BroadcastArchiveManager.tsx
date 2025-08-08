'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Database,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart3,
  Download,
  Play
} from 'lucide-react';
import { BroadcastStatusService } from '@/lib/services/broadcast-status.service';
import { useToast } from '@/components/ui/use-toast';

interface CleanupStats {
  active_broadcasts: number;
  completed_broadcasts: number;
  expired_broadcasts: number;
  total_broadcasts: number;
  table_size: string;
  last_cleanup_date?: string;
  next_scheduled_cleanup?: string;
}

interface CleanupHistoryItem {
  cleanup_date: string;
  broadcasts_deleted: number;
  status: string;
  duration_ms: number;
}

export default function BroadcastCleanupManager() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [cleanupHistory, setCleanupHistory] = useState<CleanupHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualCleanupRunning, setIsManualCleanupRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCleanupData();
  }, []);

  const loadCleanupData = async () => {
    try {
      setIsLoading(true);
      const [cleanupStats, history] = await Promise.all([
        BroadcastStatusService.getCleanupStatus(),
        BroadcastStatusService.getCleanupHistory()
      ]);
      
      setStats(cleanupStats);
      setCleanupHistory(history);
    } catch (error) {
      console.error('Error loading cleanup data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cleanup statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    if (!confirm('This will permanently delete old broadcasts according to the retention policy. This action cannot be undone. Continue?')) {
      return;
    }

    try {
      setIsManualCleanupRunning(true);
      const result = await BroadcastStatusService.triggerManualCleanup();
      
      if (result.success) {
        toast({
          title: 'Cleanup Complete',
          description: result.message,
        });
        // Refresh data after cleanup
        await loadCleanupData();
      } else {
        toast({
          title: 'Cleanup Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error triggering manual cleanup:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger manual cleanup',
        variant: 'destructive'
      });
    } finally {
      setIsManualCleanupRunning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Broadcast Cleanup Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Broadcast Cleanup Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadCleanupData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleManualCleanup}
              disabled={isManualCleanupRunning}
            >
              {isManualCleanupRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Manual Cleanup
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cleanup Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Active</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.active_broadcasts}</div>
              <p className="text-xs text-green-600">Currently live</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Completed</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.completed_broadcasts}</div>
              <p className="text-xs text-blue-600">Delete in 30 days</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Expired</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{stats.expired_broadcasts}</div>
              <p className="text-xs text-orange-600">Delete in 14 days</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Total Size</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.table_size}</div>
              <p className="text-xs text-purple-600">{stats.total_broadcasts} broadcasts</p>
            </div>
          </div>
        )}

        {/* Last Cleanup Info */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Last Cleanup</span>
              </div>
              <div className="text-lg font-semibold">
                {stats.last_cleanup_date ? formatDate(stats.last_cleanup_date) : 'Never'}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Next Scheduled</span>
              </div>
              <div className="text-lg font-semibold">
                {stats.next_scheduled_cleanup ? formatDate(stats.next_scheduled_cleanup) : 'Tonight at 3 AM UTC'}
              </div>
            </div>
          </div>
        )}

        {/* Cleanup History */}
        {cleanupHistory.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Recent Cleanup History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cleanupHistory.map((cleanup, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={cleanup.status === 'completed' ? 'default' : 'destructive'}>
                        {cleanup.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {cleanup.broadcasts_deleted} broadcasts deleted
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(cleanup.cleanup_date)} • Duration: {formatDuration(cleanup.duration_ms)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deletion Policy Information */}
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">⚠️ PERMANENT DELETION POLICY</span>
          </div>
          <div className="text-xs text-red-700 space-y-1">
            <p><strong>NO RECOVERY:</strong> Deleted broadcasts cannot be restored</p>
            <p>• <strong>Active broadcasts:</strong> Deleted 7 days after expiry (or 14 days if no expiry)</p>
            <p>• <strong>Completed broadcasts:</strong> Deleted after 30 days</p>
            <p>• <strong>Expired broadcasts:</strong> Deleted after 14 days</p>
            <p>• <strong>Schedule:</strong> Runs daily at 3 AM UTC (8 PM PST / 11 PM EST)</p>
            <p className="mt-2 italic">To prevent deletion, keep broadcasts in 'active' status without expiry date</p>
          </div>
        </div>

        {/* Export Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Export Before Deletion</span>
          </div>
          <div className="text-xs text-amber-700">
            <p>Important broadcasts should be exported before they're deleted. Use the export feature on individual broadcast pages to save data locally.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}