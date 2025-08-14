'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  redirectTo?: string;
}

export function LogoutButton({ 
  variant = 'outline',
  size = 'default',
  className,
  showIcon = true,
  children,
  redirectTo = '/login'
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      
      router.push(redirectTo);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children || (isLoggingOut ? 'Signing out...' : 'Sign Out')}
    </Button>
  );
}