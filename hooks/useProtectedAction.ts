import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface ProtectedActionOptions {
  authMessage?: string;
  onAuthRequired?: () => void;
  requiresAuth?: boolean;
}

export function useProtectedAction() {
  const { user } = useAuth();

  const executeAction = useCallback(
    async <T>(
      action: () => Promise<T> | T,
      options: ProtectedActionOptions = {}
    ): Promise<T | null> => {
      const { 
        authMessage = 'You need to sign in to perform this action',
        onAuthRequired,
        requiresAuth = true 
      } = options;

      // If auth is not required, just execute the action
      if (!requiresAuth) {
        return await action();
      }

      // Check if user is authenticated
      if (!user) {
        if (onAuthRequired) {
          onAuthRequired();
        } else {
          // Default behavior: redirect directly to login
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem('redirectAfterLogin', currentPath);
          window.location.href = '/login';
        }
        return null;
      }

      // User is authenticated, execute the action
      try {
        return await action();
      } catch (error) {
        console.error('Protected action failed:', error);
        throw error;
      }
    },
    [user]
  );

  return {
    executeAction,
    isAuthenticated: !!user,
    user
  };
}