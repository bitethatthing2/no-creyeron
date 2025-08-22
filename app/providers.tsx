'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/lib/hooks/useLocationState';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { QueryProvider } from '@/lib/providers/query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      {/* QueryProvider temporarily disabled - enable when ready to use optimized components */}
      {/* <QueryProvider> */}
        <AuthProvider>
          <LocationProvider>
            {children}
          </LocationProvider>
        </AuthProvider>
      {/* </QueryProvider> */}
    </AuthErrorBoundary>
  );
}

// Keep the original QueryStateProvider for backward compatibility
export function QueryStateProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
