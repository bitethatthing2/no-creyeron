'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  fallbackHref?: string;
  onBack?: () => void;
  label?: string;
  showLabel?: boolean;
  isCloseButton?: boolean;
}

export function BackButton({
  variant = 'ghost',
  size = 'default',
  className,
  fallbackHref,
  onBack,
  label,
  showLabel = false,
  isCloseButton = false
}: BackButtonProps) {
  const router = useRouter();
  // // const pathname = usePathname() // TODO: Remove if not needed // Unused;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    // Check if we can go back in history
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    } else {
      // Default fallback to home
      router.push('/');
    }
  };

  const getIcon = () => {
    return isCloseButton ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />;
  };

  const getAriaLabel = () => {
    if (label) return label;
    return isCloseButton ? 'Close' : 'Go back';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn(
        "flex items-center gap-2",
        isCloseButton && "rounded-full p-2",
        className
      )}
      aria-label={getAriaLabel()}
    >
      {getIcon()}
      {showLabel && (
        <span className="hidden sm:inline">
          {label || (isCloseButton ? 'Close' : 'Back')}
        </span>
      )}
    </Button>
  );
}

// Hook for programmatic back navigation
export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = (fallbackHref?: string) => {
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    } else {
      router.push('/');
    }
  };

  const canGoBack = () => {
    return window.history.length > 1;
  };

  return {
    goBack,
    canGoBack,
    currentPath: pathname
  };
}
