'use client';

import { useState } from 'react';
import AuthDebugDashboard from '@/components/admin/AuthDebugDashboard';
import SuperAdminDashboardSwitcher from '@/components/admin/SuperAdminDashboardSwitcher';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminDebugPage() {
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const supabase = createClientComponentClient();

  const applySupremeAdminAccess = async () => {
    setIsApplying(true);
    setMigrationStatus(null);

    try {
      // Step 1: Update user to supreme admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update the user with supreme admin privileges
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          auth_id: user.id,
          email: user.email,
          first_name: 'Michael',
          last_name: 'Kahler',
          display_name: 'Supreme Admin',
          role: 'supreme_admin',
          permissions: {
            super_admin: true,
            can_access_all: true,
            can_edit_all: true,
            can_delete_all: true,
            bypass_rls: true,
            admin_override: true,
            supreme_access: true
          },
          is_wolfpack_member: true,
          wolfpack_status: 'supreme',
          is_vip: true,
          is_dj: true,
          location_preference: 'both'
        }, {
          onConflict: 'email'
        });

      if (updateError) {
        throw updateError;
      }

      // Step 2: Test DJ broadcast access
      const testBroadcast = {
        dj_id: (await supabase.from('users').select('id').eq('auth_id', user.id).single()).data?.id,
        title: 'Supreme Admin Test',
        message: 'Testing supreme admin access to DJ broadcasts',
        broadcast_type: 'general',
        duration_seconds: 30
      };

      const { error: broadcastError } = await supabase
        .from('dj_broadcasts')
        .insert(testBroadcast);

      if (broadcastError) {
        console.warn('Broadcast test failed:', broadcastError);
        setMigrationStatus('Supreme admin access granted, but DJ broadcast needs manual RLS update. Please run the SQL migration in Supabase dashboard.');
      } else {
        setMigrationStatus('✅ Supreme admin access successfully granted! All systems operational.');
      }

    } catch (error: any) {
      console.error('Error applying supreme admin access:', error);
      setMigrationStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <SuperAdminDashboardSwitcher currentDashboard="admin" userEmail="mkahler599@gmail.com" />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Supreme Admin Debug Center</h1>
          <p className="text-gray-600">Diagnostic tools and access management for mkahler599@gmail.com</p>
        </div>

        {/* Quick Access Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Supreme Admin Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Apply supreme admin privileges and fix all 403 permission errors for mkahler599@gmail.com
            </p>
            
            <Button 
              onClick={applySupremeAdminAccess}
              disabled={isApplying}
              className="bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isApplying ? 'Applying Supreme Access...' : 'Grant Supreme Admin Access'}
            </Button>

            {migrationStatus && (
              <Alert className={migrationStatus.includes('✅') ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{migrationStatus}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Manual SQL Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Database Update (If Needed)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If the automatic update fails, run this SQL directly in your Supabase dashboard → SQL Editor:
            </p>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`-- Grant supreme admin access to mkahler599@gmail.com
UPDATE users SET 
  role = 'supreme_admin',
  permissions = '{"super_admin": true, "can_access_all": true, "can_edit_all": true, "bypass_rls": true}',
  is_dj = true,
  is_vip = true
WHERE email = 'mkahler599@gmail.com';

-- Create override policy for DJ broadcasts (fixed to avoid recursion)
DROP POLICY IF EXISTS "Supreme admin override" ON dj_broadcasts;
CREATE POLICY "Supreme admin override" ON dj_broadcasts
  FOR ALL USING (
    auth.uid() = '5a76f108-464b-490b-a4c8-2e6b337f895e'::uuid
    OR
    auth.jwt() ->> 'role' IN ('dj', 'admin', 'supreme_admin')
  );`}
            </pre>
          </CardContent>
        </Card>

        {/* Authentication Debug Dashboard */}
        <AuthDebugDashboard />
      </div>
    </div>
  );
}