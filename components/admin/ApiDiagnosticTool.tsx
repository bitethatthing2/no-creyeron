'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Database, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApiTestResult {
  status?: number;
  statusText?: string;
  time?: string;
  data?: unknown;
  error?: string;
}

interface ApiDiagnosticToolProps {
  compact?: boolean;
}

export function ApiDiagnosticTool({ compact = false }: ApiDiagnosticToolProps) {
  const [results, setResults] = useState<Record<string, ApiTestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [dbRelationshipStatus, setDbRelationshipStatus] = useState<'unknown' | 'checking' | 'ok' | 'error'>('unknown');
  const [relationshipDetails, setRelationshipDetails] = useState<string | null>(null);
  
  const testEndpoints = [
    { name: 'Basic DB Test', url: '/api/admin/test-db' },
    { name: 'DB Health Check', url: '/api/admin/db-health-check' },
    { name: 'Orders API (Pending)', url: '/api/admin/orders?status=pending' },
    { name: 'Orders API (No Filter)', url: '/api/admin/orders' },
    { name: 'Tables API', url: '/api/admin/tables/1' }
  ];
  
  // Test a specific endpoint
  const testEndpoint = async (name: string, url: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const start = Date.now();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const elapsed = Date.now() - start;
      clearTimeout(timeoutId);
      
      let data: unknown;
      try {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { parseError: true, text: text.substring(0, 500) + (text.length > 500 ? '...' : '') };
        }
      } catch (e) {
        data = { responseError: true, message: e instanceof Error ? e.message : String(e) };
      }
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          statusText: response.statusText,
          time: elapsed + 'ms',
          data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error instanceof Error ? error.message : String(error)
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };
  
  // Test all endpoints
  const testAll = () => {
    testEndpoints.forEach(endpoint => {
      testEndpoint(endpoint.name, endpoint.url);
    });
  };
  
  // Specifically check database table relationships
  const checkDatabaseRelationships = async () => {
    setDbRelationshipStatus('checking');
    setRelationshipDetails(null);
    
    try {
      // First test the general health endpoint
      const healthResponse = await fetch('/api/admin/db-health-check', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const healthData = await healthResponse.json();
      
      // We'll add our own specific test for the orders-tables relationship
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Create a custom query to test the orders-tables relationship
      // This doesn't need to work - we're testing if it fails in the expected way
      const relationshipCheckResponse = await fetch('/api/admin/test-db', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Parse the response 
      const relationshipData = await relationshipCheckResponse.json();
      
      // Analyze the results to determine relationship status
      let relationshipMessage = '';
      let relationshipStatus: 'ok' | 'error' = 'ok';
      
      // Check each test result from the diagnostics
      if (healthData.diagnostics) {
        const ordersOk = healthData.diagnostics.ordersTable?.success;
        const tablesOk = healthData.diagnostics.tablesTable?.success;
        
        if (!ordersOk) {
          relationshipMessage += "🔴 'orders' table access failed. Check if the table exists and has proper RLS policies.\n";
          relationshipStatus = 'error';
        } else {
          relationshipMessage += "✅ 'orders' table access successful.\n";
        }
        
        if (!tablesOk) {
          relationshipMessage += "🔴 'tables' table access failed. Check if the table exists and has proper RLS policies.\n";
          relationshipStatus = 'error';
        } else {
          relationshipMessage += "✅ 'tables' table access successful.\n";
        }
      }
      
      // Check specific relationship tests from the test-db endpoint
      if (relationshipData.tests?.tablesQuery) {
        if (!relationshipData.tests.tablesQuery.success) {
          relationshipMessage += "🔴 Table query test failed: " + 
            (relationshipData.tests.tablesQuery.error || "Unknown error") + "\n";
          relationshipStatus = 'error';
        } else {
          relationshipMessage += "✅ Table query test passed.\n";
        }
      }
      
      // Set the final status
      setDbRelationshipStatus(relationshipStatus);
      setRelationshipDetails(relationshipMessage);
      
    } catch (error) {
      setDbRelationshipStatus('error');
      setRelationshipDetails(
        `Failed to check database relationships: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">API & Database Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api">API Endpoints</TabsTrigger>
            <TabsTrigger value="db">Database Relationships</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={testAll} variant="default">Test All Endpoints</Button>
              {testEndpoints.map(endpoint => (
                <Button 
                  key={endpoint.name}
                  onClick={() => testEndpoint(endpoint.name, endpoint.url)}
                  variant="outline"
                  disabled={loading[endpoint.name]}
                >
                  {loading[endpoint.name] ? (
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Testing...
                    </span>
                  ) : endpoint.name}
                </Button>
              ))}
            </div>
            
            <div className="space-y-3">
              {Object.entries(results).map(([name, result]) => (
                <div key={name} className="p-3 bg-muted rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{name}</h3>
                    <div className="flex items-center">
                      {result.status && (
                        <>
                          {result.status >= 200 && result.status < 300 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            result.status >= 200 && result.status < 300 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {result.status}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">{result.time}</span>
                        </>
                      )}
                      {result.error && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Error
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 text-xs rounded">
                      {result.error}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <details>
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        View response details
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 bg-card p-2 rounded">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                  
                  {result.status && result.status >= 400 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="font-medium text-red-500 dark:text-red-400">Troubleshooting Steps:</p>
                      <ol className="list-decimal pl-4 space-y-1 mt-1">
                        <li>Check your database connection settings in Supabase</li>
                        <li>Verify table permissions in Supabase (missing RLS policies?)</li>
                        <li>Check if the &#39;bartender_orders&#39; and &#39;tables&#39; tables exist</li>
                        <li>Examine foreign key constraints between tables</li>
                        <li>Check for network or CORS issues</li>
                        <li>Verify your authentication is working properly</li>
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="db" className="space-y-4 pt-4">
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Database Relationship Diagnostics</h3>
                </div>
                <Button 
                  onClick={checkDatabaseRelationships}
                  variant="outline"
                  size="sm"
                  disabled={dbRelationshipStatus === 'checking'}
                >
                  {dbRelationshipStatus === 'checking' ? (
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </span>
                  ) : "Check Table Relationships"}
                </Button>
              </div>
              
              {dbRelationshipStatus !== 'unknown' && (
                <div className="mt-3">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-sm mr-2">Status:</span>
                    {dbRelationshipStatus === 'checking' && (
                      <span className="flex items-center text-sm text-blue-500">
                        <Clock className="h-3 w-3 mr-1 animate-spin" />
                        Checking...
                      </span>
                    )}
                    {dbRelationshipStatus === 'ok' && (
                      <span className="flex items-center text-sm text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Database relationships OK
                      </span>
                    )}
                    {dbRelationshipStatus === 'error' && (
                      <span className="flex items-center text-sm text-red-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Relationship issues detected
                      </span>
                    )}
                  </div>
                  
                  {relationshipDetails && (
                    <div className={`p-3 rounded text-xs font-mono whitespace-pre-wrap ${
                      dbRelationshipStatus === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300' 
                        : 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-300'
                    }`}>
                      {relationshipDetails}
                    </div>
                  )}
                  
                  {dbRelationshipStatus === 'error' && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md">
                      <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Common Database Relationship Issues:
                      </h4>
                      <ol className="list-decimal pl-4 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                        <li>Missing foreign key constraints between &#39;orders&#39; and &#39;tables&#39;</li>
                        <li>Mismatched column types (e.g. UUID vs. string)</li>
                        <li>Database migrations not run properly</li>
                        <li>RLS policies preventing joins between tables</li>
                        <li>Incorrect table or column names</li>
                      </ol>
                      
                      <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                        <strong>Suggested Fix:</strong> Verify the schema and run this SQL to check foreign keys:
                        <pre className="mt-1 p-2 bg-amber-100 dark:bg-amber-900/30 rounded overflow-auto text-xs">
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = &#39;FOREIGN KEY&#39;;
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-xs text-muted-foreground">
                <p>This tool helps identify issues with database table relationships, particularly between the orders and tables tables. Click the button above to run diagnostics.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
