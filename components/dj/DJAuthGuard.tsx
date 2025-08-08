'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Music, AlertCircle, Loader2 } from 'lucide-react';

interface DJAuthGuardProps {
  children: React.ReactNode;
  requiredLocation?: 'salem' | 'portland';
}

// This component is already compatible with the new schema!
// It only checks permissions, not the database structure
export function DJAuthGuard({ children, requiredLocation }: DJAuthGuardProps) {
  const { isActiveDJ, assignedLocation, isLoading } = useDJPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isActiveDJ) {
      router.push('/wolfpack');
    }
  }, [isActiveDJ, isLoading, router]);

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center p-6">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Checking DJ Permissions</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your access...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isActiveDJ) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center p-6">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">DJ Access Required</h2>
          <p className="text-muted-foreground">
            You need DJ permissions to access this area. Contact an administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (requiredLocation && assignedLocation !== requiredLocation) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center p-6">
          <Music className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Wrong Location</h2>
          <p className="text-muted-foreground">
            You&apos;re assigned to {assignedLocation} but trying to access {requiredLocation}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}