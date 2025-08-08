'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireProfile?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  requireProfile = false,
  redirectTo = '/login',
  fallback = <div>Loading...</div>
}: AuthGuardProps) => {
  const { isAuthenticated, hasProfile, isReady, loading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isReady || loading) {
      return;
    }

    if (requireAuth && !isAuthenticated) {
      console.log('[AuthGuard] User not authenticated, redirecting to:', redirectTo);
      router.push(redirectTo);
      return;
    }

    if (requireProfile && !hasProfile) {
      console.log('[AuthGuard] User profile required but not found, redirecting to profile setup');
      router.push('/profile/setup');
      return;
    }

    setShouldRender(true);
  }, [isReady, loading, isAuthenticated, hasProfile, requireAuth, requireProfile, redirectTo, router]);

  if (!isReady || loading) {
    return <>{fallback}</>;
  }

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for protecting actions (like, comment, etc.)
export const useAuthAction = () => {
  const { isAuthenticated, hasProfile, requireAuth, requireProfile } = useAuth();
  const router = useRouter();

  const executeWithAuth = async (action: () => Promise<void> | void, options?: {
    requireProfile?: boolean;
    redirectTo?: string;
  }) => {
    try {
      if (!isAuthenticated) {
        console.log('[useAuthAction] User not authenticated, redirecting to login');
        // Store current path for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('redirectAfterLogin', currentPath);
        router.push(options?.redirectTo || '/login');
        return;
      }

      if (options?.requireProfile && !hasProfile) {
        console.log('[useAuthAction] User profile required, redirecting to profile setup');
        router.push('/profile/setup');
        return;
      }

      // Validate auth state before executing action
      if (options?.requireProfile) {
        requireProfile();
      } else {
        requireAuth();
      }

      await action();
    } catch (error) {
      console.error('[useAuthAction] Error executing authenticated action:', error);
      
      // If it's an auth error, redirect to login
      if (error instanceof Error && error.message.includes('authenticated')) {
        router.push('/login');
      } else {
        throw error;
      }
    }
  };

  return {
    executeWithAuth,
    isAuthenticated,
    hasProfile
  };
};

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireProfile?: boolean;
    redirectTo?: string;
  }
) => {
  const AuthenticatedComponent = (props: P) => {
    return (
      <AuthGuard 
        requireAuth={true}
        requireProfile={options?.requireProfile}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

// Session validation utility
export const validateSession = async () => {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[validateSession] Session validation error:', error);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('[validateSession] Unexpected error:', error);
    return false;
  }
};