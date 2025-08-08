'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserMigration } from './UserMigration';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Add current URL as returnUrl for better UX
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = currentPath === '/login' ? '/login' : `/login?returnUrl=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Wolf Pack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user needs migration
  if (user && !userProfile?.auth_id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <UserMigration email={user.email!} />
      </div>
    );
  }

  return <>{children}</>;
}