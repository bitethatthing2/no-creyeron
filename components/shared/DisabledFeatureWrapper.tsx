'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import type { WolfpackStatusType } from '@/types/features/wolfpack-interfaces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MapPin, Users, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface DisabledFeatureWrapperProps {
  children: ReactNode;
  featureType: 'chat' | 'bartab' | 'cart' | 'events';
  featureName: string;
  description?: string;
  disabled?: boolean;
  requiresLocation?: boolean;
  onFeatureClick?: () => void;
  className?: string;
}

export function DisabledFeatureWrapper({
  children,
  featureType,
  featureName,
  description,
  disabled = false,
  requiresLocation = false,
  onFeatureClick,
  className
}: DisabledFeatureWrapperProps) {
  const router = useRouter();
  const { wolfpackStatus, locationStatus, checkLocationPermission, refreshData } = useWolfpackAccess();
  // Add fallback functions if they don't exist
  const checkFeatureAccess = () => Promise.resolve(true);
  const requestLocationAccess = checkLocationPermission;
  const joinWolfpack = refreshData;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // If explicitly disabled, show disabled state
  if (disabled) {
    return (
      <div className={`relative ${className || ''}`}>
        <div className="opacity-50 cursor-not-allowed">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <Badge variant="secondary" className="pointer-events-none">
            <Lock className="h-3 w-3 mr-1" />
            Disabled
          </Badge>
        </div>
      </div>
    );
  }

  // Check if feature should be disabled based on Wolfpack status
  const shouldShowDialog = () => {
    if (!wolfpackStatus) return false;
    
    // Non-members need different handling based on feature type
    if (featureType === 'chat' || featureType === 'bartab') {
      return !wolfpackStatus.isActive; // These require membership
    }

    if (featureType === 'cart') {
      return !(wolfpackStatus.isActive || locationStatus?.isAtLocation); // Cart requires location for non-members
    }

    return false;
  };

  const handleFeatureAccess = async () => {
    if (!wolfpackStatus) return;

    if (onFeatureClick) {
      onFeatureClick();
      return;
    }

    // Handle events separately since it's not in checkFeatureAccess
    if (featureType === 'events') {
      // Events are generally accessible to all users
      return;
    }

    setIsChecking(true);
    try {
      await checkFeatureAccess();
      setIsChecking(false);
      // Feature is accessible, proceed normally
      return;
    } catch (error) {
      setIsChecking(false);
    }

    // Show appropriate dialog based on what's needed
    setIsDialogOpen(true);
  };

  const handleLocationRequest = async () => {
    try {
      await requestLocationAccess();
      setIsDialogOpen(false);
      toast.success('Location verified! You can now access this feature.');
    } catch (error) {
      toast.error('Failed to verify location. Please try again.');
    }
  };

  const handleJoinWolfpack = () => {
    setIsDialogOpen(false);
    router.push('/login');
  };

  const getDialogContent = () => {
    if (!wolfpackStatus.isActive && (featureType === 'chat' || featureType === 'bartab')) {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Wolfpack Membership Required
            </DialogTitle>
            <DialogDescription>
              {featureName} is exclusive to Wolfpack members
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Join the Wolfpack</CardTitle>
              <CardDescription>
                Unlock exclusive features and benefits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">Instant bar tab access</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">Exclusive member chat</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">Priority service</span>
                </div>
              </div>
              <Button onClick={handleJoinWolfpack} className="w-full">
                Join Wolfpack
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    if (featureType === 'cart' && !(wolfpackStatus.isActive || locationStatus?.isAtLocation)) {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Verification Required
            </DialogTitle>
            <DialogDescription>
              We need to verify your location to enable {featureName.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why do we need your location?</CardTitle>
              <CardDescription>
                Location verification ensures you&apos;re at our establishment for order pickup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">Secure order processing</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">Accurate pickup timing</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">Better service experience</span>
                </div>
              </div>
              <Button onClick={handleLocationRequest} className="w-full">
                Verify Location
                <MapPin className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    return null;
  };

  // If should show dialog, wrap with dialog trigger
  if (shouldShowDialog()) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className={`cursor-pointer ${className || ''}`} onClick={handleFeatureAccess}>
            {children}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {getDialogContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Normal access - render children with click handler if provided
  return (
    <div className={className} onClick={handleFeatureAccess}>
      {children}
    </div>
  );
}

// Hook for checking feature access status
export function useFeatureAccess(featureType: 'chat' | 'bartab' | 'cart' | 'events') {
  const { wolfpackStatus: _wolfpackStatus, locationStatus: location, checkLocationPermission: checkFeatureAccess } = useWolfpackAccess();
  const wolfpackStatus = _wolfpackStatus;

  const isFeatureEnabled = () => {
    if (!wolfpackStatus) return false;
    
    // Wolfpack members get full access
    if (wolfpackStatus.isActive) return true;
    
    // Non-members can access cart if location verified
    if (featureType === 'cart' && location?.isAtLocation) return true;
    
    // Other features require membership
    return false;
  };

  const getFeatureStatus = () => {
    if (!wolfpackStatus) return 'loading';
    if (isFeatureEnabled()) return 'enabled';
    if (featureType === 'cart' && !location?.isAtLocation) return 'needs-location';
    return 'needs-membership';
  };

  return {
    isEnabled: isFeatureEnabled(),
    status: getFeatureStatus(),
    wolfpackStatus,
    checkFeatureAccess
  };
}
