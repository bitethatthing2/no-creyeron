'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AuthStatus {
  authenticated: boolean;
  authId?: string;
  email?: string;
  lastSignIn?: string;
  error?: string;
}

interface UserInfo {
  id: string;
  email: string;
  role: string;
  permissions: any;
  diagnostic?: {
    access_level: string;
    can_use_dj_features: boolean;
  };
}

const AuthDebugDashboard = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const checkAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Auth Error: ${authError.message}`);
        setAuthStatus({ authenticated: false, error: authError.message });
        return;
      }

      if (!user) {
        setAuthStatus({ authenticated: false, error: 'No user session' });
        return;
      }

      // Get user details from database
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (dbError) {
        setError(`Database Error: ${dbError.message}`);
        return;
      }

      // Check supreme admin diagnostic view
      const { data: diagData } = await supabase
        .from('supreme_admin_diagnostic')
        .select('*')
        .single();

      setAuthStatus({
        authenticated: true,
        authId: user.id,
        email: user.email || '',
        lastSignIn: user.last_sign_in_at || ''
      });

      setUserInfo({
        ...userData,
        diagnostic: diagData
      });

    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fix authentication issues
  const fixAuthentication = async () => {
    try {
      // Refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      // Re-check auth status
      await checkAuthStatus();
      
      // Force a page reload to ensure all components get the new session
      window.location.reload();
    } catch (err: any) {
      setError(`Failed to refresh session: ${err.message}`);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Auth Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Authentication Status
          </h2>
          <button
            onClick={checkAuthStatus}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {authStatus?.authenticated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              Authentication: {authStatus?.authenticated ? 'Active' : 'Not Authenticated'}
            </span>
          </div>

          {authStatus?.authenticated && (
            <>
              <div className="pl-7 space-y-2 text-sm">
                <div>Auth ID: <code className="bg-gray-100 px-2 py-1 rounded">{authStatus.authId}</code></div>
                <div>Email: <code className="bg-gray-100 px-2 py-1 rounded">{authStatus.email}</code></div>
                <div>Last Sign In: {authStatus.lastSignIn ? new Date(authStatus.lastSignIn).toLocaleString() : 'Never'}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Info Card */}
      {userInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">User Database Info</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Role:</span>
              <div className="font-mono mt-1 p-2 bg-purple-100 rounded">
                {userInfo.role}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">Super Admin:</span>
              <div className="font-mono mt-1 p-2 bg-purple-100 rounded">
                {userInfo.permissions?.super_admin ? 'YES' : 'NO'}
              </div>
            </div>

            <div>
              <span className="text-gray-600">DJ Access:</span>
              <div className="font-mono mt-1 p-2 bg-blue-100 rounded">
                {userInfo.diagnostic?.can_use_dj_features ? 'YES' : 'NO'}
              </div>
            </div>

            <div>
              <span className="text-gray-600">Access Level:</span>
              <div className="font-mono mt-1 p-2 bg-green-100 rounded text-sm">
                {userInfo.diagnostic?.access_level}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 mb-2">Permissions:</div>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(userInfo.permissions, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={fixAuthentication}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Authentication Session
          </button>

          <button
            onClick={() => window.location.href = '/dj'}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Go to DJ Dashboard
          </button>

          <button
            onClick={() => window.location.href = '/admin'}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>

      {/* Debug SQL Queries */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h4 className="font-bold mb-2">Debug SQL Queries:</h4>
        <pre className="text-xs overflow-x-auto bg-white p-3 rounded">
{`-- Check your user in database
SELECT * FROM users WHERE email = 'mkahler599@gmail.com';

-- Check supreme admin diagnostic
SELECT * FROM supreme_admin_diagnostic;

-- Test broadcast insert
INSERT INTO dj_broadcasts (dj_id, title, message) 
VALUES (
  (SELECT id FROM users WHERE email = 'mkahler599@gmail.com'),
  'Test Broadcast',
  'Testing from SQL'
);`}
        </pre>
      </div>
    </div>
  );
};

export default AuthDebugDashboard;