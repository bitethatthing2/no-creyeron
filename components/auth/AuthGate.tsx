'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
  showSignUp?: boolean;
  className?: string;
}

export function AuthGate({ 
  children, 
  fallback,
  message = "Please sign in to continue",
  showSignUp = true,
  className = ""
}: AuthGateProps) {
  const { user, loading } = useAuth();

  const handleSignIn = () => {
    // Store current path for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    window.location.href = '/login';
  };

  const handleSignUp = () => {
    // Store current path for redirect after signup
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    window.location.href = '/login?mode=signup';
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If authenticated, show protected content
  if (user) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default auth prompt
  return (
    <div className={`text-center p-8 bg-zinc-900/50 rounded-xl border border-zinc-700 ${className}`}>
      <div className="max-w-sm mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full 
                        flex items-center justify-center shadow-lg shadow-orange-500/25 mx-auto mb-4">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          Authentication Required
        </h3>
        
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleSignIn}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5
                     shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 
                     transition-all duration-200"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          
          {showSignUp && (
            <Button
              onClick={handleSignUp}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-2.5"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          )}
        </div>
        
        <p className="text-xs text-zinc-500 mt-4">
          Join the Side Hustle Bar community to interact with posts and connect with other members.
        </p>
      </div>
    </div>
  );
}