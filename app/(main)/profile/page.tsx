'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, loading, isReady } = useAuth();

  useEffect(() => {
    if (!isReady || loading) return;

    if (!isAuthenticated) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }

    if (currentUser?.id) {
      // Redirect to user's own profile
      router.push(`/profile/${currentUser.id}`);
    } else {
      // User is authenticated but no profile, go to setup
      router.push('/profile/setup');
    }
  }, [currentUser, isAuthenticated, loading, isReady, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
        <p className="text-white">Loading your profile...</p>
      </div>
    </div>
  );
}