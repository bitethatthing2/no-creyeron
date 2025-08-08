'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InteractionButtonProps {
  onInteract: () => Promise<void> | void;
  requiresAuth?: boolean;
  authMessage?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function InteractionButton({
  onInteract,
  requiresAuth = true,
  authMessage = "Please sign in to perform this action", // Keep for potential future use
  children,
  className,
  disabled,
  variant = 'default',
  size = 'default'
}: InteractionButtonProps) {
  const { isAuthenticated, loading, isReady } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (disabled || isProcessing) return;

    if (requiresAuth && !isAuthenticated) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirect directly to login page
      window.location.href = '/login';
      return;
    }
    
    try {
      setIsProcessing(true);
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
      disabled={disabled || (!isReady && loading) || isProcessing}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  );
}