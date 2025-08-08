'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Database, 
  Zap, 
  Globe, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Server,
  Settings,
  RefreshCw
} from 'lucide-react';
import { getPerformanceMetrics, cleanupPerformanceOptimizer } from '@/lib/services/performance-optimizer.service';

interface PerformanceMetrics {
  subscriptionCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
  dataTransferRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastUpdate: number;
  issues: string[];
}

interface PerformanceMonitorProps {
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}

export default function PerformanceMonitor({
  isVisible,
  onClose,
  className = ''
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    subscriptionCount: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    dataTransferRate: 0
  });
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    lastUpdate: Date.now(),
    issues: []
  });
  
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Update metrics
  const updateMetrics = () => {
    const newMetrics = getPerformanceMetrics();
    setMetrics(newMetrics);
    
    // Update historical data (keep last 20 data points)
    setHistoricalData(prev => [newMetrics, ...prev.slice(0, 19)]);
    
    // Update system health
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (newMetrics.averageResponseTime > 1000) {
      issues.push('High response time detected');
      status = 'warning';
    }
    
    if (newMetrics.cacheHitRate < 0.7) {
      issues.push('Low cache hit rate');
      status = 'warning';
    }
    
    if (newMetrics.subscriptionCount > 15) {
      issues.push('High subscription count');
      status = 'warning';
    }
    
    if (newMetrics.memoryUsage > 1000) {
      issues.push('High memory usage');
      status = 'critical';
    }
    
    if (newMetrics.averageResponseTime > 3000) {
      status = 'critical';
    }
    
    setSystemHealth({
      status,
      uptime: Date.now() - startTimeRef.current,
      lastUpdate: Date.now(),
      issues
    });
  };

  // Set up auto-refresh
  useEffect(() => {
    if (isVisible && isAutoRefresh) {
      updateMetrics(); // Initial update
      intervalRef.current = setInterval(updateMetrics, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible, isAutoRefresh, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get metric status
  const getMetricStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      subscriptionCount: { warning: 10, critical: 15 },
      cacheHitRate: { warning: 0.7, critical: 0.5 },
      averageResponseTime: { warning: 1000, critical: 3000 },
      memoryUsage: { warning: 500, critical: 1000 },
      activeConnections: { warning: 20, critical: 30 },
      dataTransferRate: { warning: 1000, critical: 2000 }
    };

    const threshold = thresholds[metric];
    
    if (metric === 'cacheHitRate') {
      // Lower is worse for cache hit rate
      if (value < threshold.critical) return 'critical';
      if (value < threshold.warning) return 'warning';
      return 'healthy';
    } else {
      // Higher is worse for other metrics
      if (value > threshold.critical) return 'critical';
      if (value > threshold.warning) return 'warning';
      return 'healthy';
    }
  };

  // Calculate trend
  const calculateTrend = (metric: keyof PerformanceMetrics): 'up' | 'down' | 'stable' => {
    if (historicalData.length < 2) return 'stable';
    
    const current = historicalData[0][metric];
    const previous = historicalData[1][metric];
    const change = current - previous;
    
    if (Math.abs(change) < 0.01) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="absolute top-4 right-4 w-96 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Performance Monitor</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={isAutoRefresh ? 'text-green-600' : 'text-gray-400'}
              >
                <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">System Health</h3>
            <Badge className={getStatusColor(systemHealth.status)}>
              {systemHealth.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
              {systemHealth.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {systemHealth.status === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {systemHealth.status.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Uptime</div>
              <div className="font-medium">{formatDuration(systemHealth.uptime)}</div>
            </div>
            <div>
              <div className="text-gray-500">Last Update</div>
              <div className="font-medium">{formatDuration(Date.now() - systemHealth.lastUpdate)} ago</div>
            </div>
          </div>
          
          {systemHealth.issues.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-500 mb-1">Issues:</div>
              {systemHealth.issues.map((issue, index) => (
                <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="p-4 space-y-4">
          {/* Subscriptions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Real-time Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.subscriptionCount}</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${
                    calculateTrend('subscriptionCount') === 'up' ? 'text-red-500' : 
                    calculateTrend('subscriptionCount') === 'down' ? 'text-green-500' : 'text-gray-500'
                  }`} />
                  <Badge className={getStatusColor(getMetricStatus('subscriptionCount', metrics.subscriptionCount))}>
                    {getMetricStatus('subscriptionCount', metrics.subscriptionCount)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Hit Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Cache Hit Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatPercentage(metrics.cacheHitRate)}</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${
                    calculateTrend('cacheHitRate') === 'up' ? 'text-green-500' : 
                    calculateTrend('cacheHitRate') === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`} />
                  <Badge className={getStatusColor(getMetricStatus('cacheHitRate', metrics.cacheHitRate))}>
                    {getMetricStatus('cacheHitRate', metrics.cacheHitRate)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{Math.round(metrics.averageResponseTime)}ms</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${
                    calculateTrend('averageResponseTime') === 'up' ? 'text-red-500' : 
                    calculateTrend('averageResponseTime') === 'down' ? 'text-green-500' : 'text-gray-500'
                  }`} />
                  <Badge className={getStatusColor(getMetricStatus('averageResponseTime', metrics.averageResponseTime))}>
                    {getMetricStatus('averageResponseTime', metrics.averageResponseTime)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.memoryUsage}</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${
                    calculateTrend('memoryUsage') === 'up' ? 'text-red-500' : 
                    calculateTrend('memoryUsage') === 'down' ? 'text-green-500' : 'text-gray-500'
                  }`} />
                  <Badge className={getStatusColor(getMetricStatus('memoryUsage', metrics.memoryUsage))}>
                    {getMetricStatus('memoryUsage', metrics.memoryUsage)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Connections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metrics.activeConnections}</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${
                    calculateTrend('activeConnections') === 'up' ? 'text-red-500' : 
                    calculateTrend('activeConnections') === 'down' ? 'text-green-500' : 'text-gray-500'
                  }`} />
                  <Badge className={getStatusColor(getMetricStatus('activeConnections', metrics.activeConnections))}>
                    {getMetricStatus('activeConnections', metrics.activeConnections)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={updateMetrics}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanupPerformanceOptimizer()}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Cleanup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}