'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function UserMigration({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useAuth();

  const handleMigration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Check if user needs migration
      const { data: migrationCheck } = await supabase
        .rpc('migrate_user_to_auth', { p_email: email });

      if (!migrationCheck?.success) {
        setError(migrationCheck?.message || 'Migration check failed');
        return;
      }

      // Step 2: Create auth user (sign up with temporary password)
      const tempPassword = `Wolfpack${Date.now()}!`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(`Auth creation failed: ${signUpError.message}`);
        return;
      }

      if (!authData.user) {
        setError('No user returned from sign up');
        return;
      }

      // Step 3: Link the user to auth
      const { data: linkResult } = await supabase
        .rpc('link_user_to_auth', {
          p_user_id: migrationCheck.user_id,
          p_auth_id: authData.user.id,
        });

      if (!linkResult?.success) {
        setError(linkResult?.message || 'Failed to link user to auth');
        return;
      }

      // Step 4: Send password reset email
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      alert('Migration successful! Check your email to set your password.');
      
      // Refresh the session
      await refreshSession();
    } catch (err) {
      console.error('Migration error:', err);
      setError('An unexpected error occurred during migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🐺</div>
        <h3 className="text-xl font-bold text-yellow-400 mb-2">Account Migration Required</h3>
        <p className="text-yellow-200 text-sm">
          Your account needs to be migrated to our new authentication system for enhanced security.
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="text-sm text-gray-300">
          <p className="mb-2">This will:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Create a secure authentication account</li>
            <li>Link your existing profile and data</li>
            <li>Send you an email to set your password</li>
            <li>Maintain all your Wolf Pack content</li>
          </ul>
        </div>
        
        <button
          onClick={handleMigration}
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Migrating Account...
            </div>
          ) : (
            'Migrate My Account'
          )}
        </button>
        
        <p className="text-xs text-gray-400 text-center">
          Need help? Contact support for assistance with migration.
        </p>
      </div>
    </div>
  );
}