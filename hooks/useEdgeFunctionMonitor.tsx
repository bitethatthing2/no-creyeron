// Edge Function Monitoring Hook
import { useEffect, useState, useCallback } from 'react';

interface EdgeFunctionStatus {
  isAvailable: boolean;
  responseTime: number | null;
  lastChecked: Date | null;
  version?: string;
  error?: string;
}

interface MonitoringOptions {
  checkInterval?: number; // in milliseconds, default 5 minutes
  enableAutoCheck?: boolean; // default true
  logToConsole?: boolean; // default true in development
}

export const useEdgeFunctionMonitor = (options: MonitoringOptions = {}) => {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    enableAutoCheck = true,
    logToConsole = process.env.NODE_ENV === 'development'
  } = options;

  const [status, setStatus] = useState<EdgeFunctionStatus>({
    isAvailable: false,
    responseTime: null,
    lastChecked: null
  });

  const [loading, setLoading] = useState(false);

  // removed duplicate import of useCallback

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'}/functions/v1/MENU_ITEMS/health`,
        { 
          method: 'GET', 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        const newStatus: EdgeFunctionStatus = {
          isAvailable: true,
          responseTime,
          lastChecked: new Date(),
          version: data.version,
          error: undefined
        };
        
        setStatus(newStatus);
        
        if (logToConsole) {
          console.log('✅ MENU_ITEMS Edge Function: Healthy', {
            responseTime: `${responseTime}ms`,
            version: data.version,
            timestamp: new Date().toISOString()
          });
        }

        // Send to analytics if available
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'edge_function_health_check', {
            status: 'healthy',
            response_time: responseTime,
            version: data.version
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const newStatus: EdgeFunctionStatus = {
        isAvailable: false,
        responseTime: null,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setStatus(newStatus);
      
      if (logToConsole) {
        console.warn('⚠️ MENU_ITEMS Edge Function: Unavailable', {
          error: newStatus.error,
          timestamp: new Date().toISOString()
        });
      }

      // Send to analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'edge_function_health_check', {
          status: 'error',
          error: newStatus.error ?? ''
        });
      }
    } finally {
      setLoading(false);
    }
  }, [logToConsole]);

  useEffect(() => {
    // Check immediately on mount
    checkStatus();
    
    if (!enableAutoCheck) return;
    
    // Set up periodic checks
    const interval = setInterval(checkStatus, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkInterval, enableAutoCheck, checkStatus]);

  // Manual refresh function
  const refresh = async () => {
    await checkStatus();
  };

  return {
    status,
    loading,
    refresh,
    // Computed properties
    isHealthy: status.isAvailable,
    isFast: status.responseTime ? status.responseTime < 200 : false,
    lastCheckedAgo: status.lastChecked 
      ? Math.round((Date.now() - status.lastChecked.getTime()) / 1000)
      : null
  };
};

// Component for displaying edge function status
export const EdgeFunctionStatusIndicator = ({ showDetails = false }) => {
  const { status, loading, refresh, isHealthy, isFast, lastCheckedAgo } = useEdgeFunctionMonitor();

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          loading ? 'bg-yellow-500 animate-pulse' :
          isHealthy ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-xs text-gray-500">
          {loading ? 'Checking...' : isHealthy ? 'Edge Function' : 'Local Data'}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">MENU_ITEMS Edge Function</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
            {isHealthy ? '✅ Healthy' : '❌ Unavailable'}
          </span>
        </div>
        
        {status.responseTime && (
          <div className="flex justify-between">
            <span>Response Time:</span>
            <span className={`font-medium ${isFast ? 'text-green-600' : 'text-yellow-600'}`}>
              {status.responseTime}ms
            </span>
          </div>
        )}
        
        {status.version && (
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="font-medium">{status.version}</span>
          </div>
        )}
        
        {lastCheckedAgo !== null && (
          <div className="flex justify-between">
            <span>Last Checked:</span>
            <span className="text-gray-500">
              {lastCheckedAgo < 60 ? `${lastCheckedAgo}s ago` : `${Math.round(lastCheckedAgo/60)}m ago`}
            </span>
          </div>
        )}
        
        {status.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <span className="text-red-600 text-xs">{status.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};