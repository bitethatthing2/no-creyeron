'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, AlertTriangle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Enhanced component for diagnosing database and API connection issues
 * Can be added to admin dashboard for troubleshooting
 */
export function DatabaseDebugger() {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<null | { 
    healthy: boolean; 
    error?: string;
    details?: string;
    latency?: string;
  }>(null);
  const [directQueryStatus, setDirectQueryStatus] = useState<null | {
    success: boolean;
    error?: string;
    data?: any;
  }>(null);
  const [apiTestStatus, setApiTestStatus] = useState<null | {
    success: boolean;
    endpoint: string;
    status?: number;
    statusText?: string;
    error?: string;
    data?: any;
  }>(null);
  
  // Run health check
  const checkHealth = async () => {
    setIsChecking(true);
    setHealthStatus(null);
    setDirectQueryStatus(null);
    setApiTestStatus(null);
    
    try {
      // Check the API endpoint
      const response = await fetch('/api/admin/db-health-check');
      const data = await response.json();
      setHealthStatus(data);
      
      // Try direct Supabase query
      const { data: queryData, error: queryError } = await supabase
        .from('bartender_orders')
        .select('count')
        .limit(1);
      
      if (queryError) {
        setDirectQueryStatus({
          success: false,
          error: queryError.message
        });
      } else {
        setDirectQueryStatus({
          success: true,
          data: queryData
        });
      }
      
      // Test orders API endpoint
      await testApiEndpoint('/api/admin/orders?status=pending');
      
    } catch (err) {
      setHealthStatus({
        healthy: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        details: 'Error occurred during health check'
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  // Test a specific API endpoint
  const testApiEndpoint = async (endpoint: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (_e) {
        responseData = { error: 'Failed to parse response as JSON' };
      }
      
      setApiTestStatus({
        success: response.ok,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
    } catch (err) {
      setApiTestStatus({
        success: false,
        endpoint,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };
  
  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
          Database Connection Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Use this tool to diagnose database connection and API issues. This component can be removed after debugging is complete.
          </p>
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={checkHealth}
                disabled={isChecking}
                className="flex-1"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Run Full Diagnostics
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => testApiEndpoint('/api/admin/orders?status=pending')}
                disabled={isChecking}
              >
                Test Pending Orders
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => testApiEndpoint('/api/admin/orders?status=ready')}
                disabled={isChecking}
              >
                Test Ready Orders
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => testApiEndpoint('/api/admin/orders?status=pending&status=ready')}
                disabled={isChecking}
              >
                Test Multiple Statuses
              </Button>
            </div>
            
            {healthStatus !== null && (
              <div className="p-3 rounded-md bg-background">
                <div className="flex items-center">
                  <div className="mr-2">
                    {healthStatus.healthy ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {healthStatus.healthy ? 'API Health Check: Healthy' : 'API Health Check: Error'}
                    </p>
                    {healthStatus.latency && (
                      <p className="text-xs text-muted-foreground">Latency: {healthStatus.latency}</p>
                    )}
                    {healthStatus.error && (
                      <p className="text-xs text-red-500 mt-1">{healthStatus.error}</p>
                    )}
                    {healthStatus.details && (
                      <p className="text-xs text-muted-foreground mt-1">{healthStatus.details}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {directQueryStatus !== null && (
              <div className="p-3 rounded-md bg-background">
                <div className="flex items-center">
                  <div className="mr-2">
                    {directQueryStatus.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {directQueryStatus.success ? 'Direct Query: Success' : 'Direct Query: Failed'}
                    </p>
                    {directQueryStatus.error && (
                      <p className="text-xs text-red-500 mt-1">{directQueryStatus.error}</p>
                    )}
                    {directQueryStatus.data && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Data: {JSON.stringify(directQueryStatus.data)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {apiTestStatus !== null && (
              <div className="p-3 rounded-md bg-background">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {apiTestStatus.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          API Test: {apiTestStatus.success ? 'Success' : 'Failed'}
                        </p>
                        {apiTestStatus.status && (
                          <Badge variant={apiTestStatus.success ? "outline" : "destructive"}>
                            {apiTestStatus.status} {apiTestStatus.statusText}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Endpoint: {apiTestStatus.endpoint}
                      </p>
                    </div>
                  </div>
                  
                  {apiTestStatus.error && (
                    <div className="bg-destructive/10 p-2 rounded text-xs">
                      Error: {apiTestStatus.error}
                    </div>
                  )}
                  
                  {apiTestStatus.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Response Data</summary>
                      <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs whitespace-pre-wrap max-h-40">
                        {JSON.stringify(apiTestStatus.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
            
            {(healthStatus?.healthy === false || directQueryStatus?.success === false || apiTestStatus?.success === false) && (
              <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Troubleshooting Suggestions</h4>
                    <ul className="mt-2 text-xs space-y-1 list-disc pl-4">
                      <li>Verify your database connection strings in environment variables</li>
                      <li>Check that Supabase tables have correct schema and permissions</li>
                      <li>Ensure the orders table has expected column names: status, table_id, etc.</li>
                      <li>Check that API route parameters are properly handled</li>
                      <li>Verify middleware isn't interfering with API routes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}