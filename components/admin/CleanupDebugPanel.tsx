'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Key, 
  User, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Terminal,
  Copy
} from 'lucide-react';

export function CleanupDebugPanel() {
  const supabase = getSupabaseBrowserClient();
  const { currentUser: user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  type TestResult = {
    status: number;
    statusText: string;
    success: boolean;
    elapsed?: string;
    data?: unknown;
    error?: string;
    timestamp: string;
  } | null;

  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check user role
  const checkUserRole = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        setUserRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('error');
      } else {
        setUserRole(data?.role || 'user');
      }
    } catch (error) {
      console.error('Error:', error);
      setUserRole('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, [user]);

  // Test the cleanup function
  const testCleanupFunction = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔍 Debug Info:');
      console.log('- User ID:', user?.id);
      console.log('- User Email:', user?.email);
      console.log('- User Role:', userRole);
      console.log('- Session exists:', !!session);
      console.log('- Access Token:', session?.access_token ? 'Present' : 'Missing');

      const startTime = Date.now();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-scheduler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const elapsed = Date.now() - startTime;
      const responseData = await response.json();

      const result = {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        elapsed: `${elapsed}ms`,
        data: responseData,
        timestamp: new Date().toISOString()
      };

      console.log('📊 Test Result:', result);
      setTestResult(result);

    } catch (error) {
      console.error('❌ Test Failed:', error);
      setTestResult({
        status: 0,
        statusText: 'Network Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Copy curl command
  const copyCurlCommand = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const curlCommand = `curl -X POST \\
  '${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-scheduler' \\
  -H 'Authorization: Bearer ${session?.access_token || 'YOUR_TOKEN_HERE'}' \\
  -H 'Content-Type: application/json'`;
    
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Cleanup Function Debug Panel
        </CardTitle>
        <CardDescription>
          Test and debug the cleanup edge function
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Authentication Status</h3>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">User</span>
              </div>
              {user ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {user.email}
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Not logged in
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Role</span>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : userRole === 'admin' ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Admin
                </Badge>
              ) : userRole === 'error' ? (
                <Badge variant="destructive">Error fetching role</Badge>
              ) : (
                <Badge variant="secondary">{userRole || 'None'}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="text-sm">Access Token</span>
              </div>
              <Badge variant={user ? "default" : "destructive"} className="gap-1">
                {user ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Present
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Missing
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Test Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={checkUserRole}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>

            <Button
              size="sm"
              variant="default"
              onClick={testCleanupFunction}
              disabled={isTesting || !user}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Cleanup Function'
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={copyCurlCommand}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy cURL'}
            </Button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-200' : 'border-red-200'}>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-semibold">
                    {testResult.status} {testResult.statusText}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    {testResult.elapsed || 'N/A'}
                  </Badge>
                </div>
                
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(testResult.data || testResult.error, null, 2)}</pre>
                </div>

                <div className="text-xs text-muted-foreground">
                  Tested at: {new Date(testResult.timestamp).toLocaleString()}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Requirements Checklist */}
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Requirements Checklist:</p>
              <ul className="text-xs space-y-1">
                <li className="flex items-center gap-2">
                  {user ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  User must be authenticated
                </li>
                <li className="flex items-center gap-2">
                  {userRole === 'admin' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  User must have admin role
                </li>
                <li className="flex items-center gap-2">
                  {user ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  Valid Supabase JWT token required
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}