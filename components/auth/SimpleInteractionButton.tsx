'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimpleInteractionButtonProps {
  onInteract: () => Promise<void> | void;
  requiresAuth?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SimpleInteractionButton({
  onInteract,
  requiresAuth = true,
  children,
  className,
  disabled,
  variant = 'default',
  size = 'default'
}: SimpleInteractionButtonProps) {
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    console.log('Button clicked, user:', !!user, 'requiresAuth:', requiresAuth);
    
    if (disabled || isProcessing || loading) return;

    // If auth is required and user is not logged in, redirect to login
    if (requiresAuth && !user) {
      console.log('Redirecting to login...');
      
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirect to login page
      window.location.href = '/login';
      return;
    }
    
    // User is authenticated or auth not required, execute the action
    try {
      setIsProcessing(true);
      console.log('Executing action...');
      await onInteract();
    } catch (error) {
      console.error('Interaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(className, isProcessing && "opacity-75")}
      disabled={disabled || loading || isProcessing}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  );
}