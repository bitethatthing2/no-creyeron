'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserSessionStatus, isUserLoggedIn } from '@/lib/auth-utils';

export function LogoutTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [isTestingSession, setIsTestingSession] = useState(false);
  const { user, currentUser, signOut } = useAuth();

  const testLoginStatus = async () => {
    setIsTestingLogin(true);
    try {
      const result = await isUserLoggedIn();
      setTestResults(prev => ({ ...prev, loginStatus: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, loginError: error }));
    }
    setIsTestingLogin(false);
  };

  const testSessionStatus = async () => {
    setIsTestingSession(true);
    try {
      const result = await checkUserSessionStatus();
      setTestResults(prev => ({ ...prev, sessionStatus: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, sessionError: error }));
    }
    setIsTestingSession(false);
  };

  const testCompleteLogout = async () => {
    try {
      await signOut();
      setTestResults(prev => ({ 
        ...prev, 
        logoutResult: { success: true, message: 'Logout completed' }
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        logoutResult: { success: false, error }
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Logout Functionality Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Auth State */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Auth State</h3>
          <p><strong>Auth User:</strong> {user ? `${user.email} (${user.id})` : 'None'}</p>
          <p><strong>Profile:</strong> {currentUser ? `${currentUser.email} (${currentUser.id})` : 'None'}</p>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testLoginStatus} 
            disabled={isTestingLogin}
            variant="outline"
          >
            {isTestingLogin ? 'Testing...' : 'Test Login Status'}
          </Button>
          
          <Button 
            onClick={testSessionStatus} 
            disabled={isTestingSession}
            variant="outline"
          >
            {isTestingSession ? 'Testing...' : 'Test Session Status'}
          </Button>
          
          <Button 
            onClick={testCompleteLogout}
            variant="destructive"
          >
            Test Complete Logout
          </Button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}