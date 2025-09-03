'use client';

import * as React from 'react';
import { NotificationProvider } from '@/components/unified';
// ServiceWorkerRegister removed - using layout.tsx registration instead
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { PwaStatusToast } from '@/components/shared/PwaStatusToast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';

interface ClientSideWrapperProps {
  /**
   * The children to be rendered within the ClientSideWrapper
   */
  children: React.ReactNode;
}

interface AuthSubscription {
  unsubscribe: () => void;
}

export default function ClientSideWrapper({ children }: ClientSideWrapperProps): React.ReactElement {
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [userId, setUserId] = React.useState<string | undefined>();
  const [authChecked, setAuthChecked] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsMounted(true);
    console.log('[ClientSideWrapper] Client-side wrapper mounted');

    // Get the actual user ID
    const initializeAuth = async (): Promise<() => void> => {
      try {        const { data: { session } }: { data: { session: { user?: { id: string } } | null } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
        
        // Mark auth as checked even if no user
        setAuthChecked(true);
        
        // Listen for auth state changes
        const { data: { subscription } }: { data: { subscription: AuthSubscription } } = supabase.auth.onAuthStateChange(
          (_event: string, session: { user?: { id: string } } | null) => {
            setUserId(session?.user?.id);
          }
        );
        
        // Store cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[ClientSideWrapper] Error initializing auth:', error);
        setAuthChecked(true); // Mark as checked even on error
        return () => {};
      }
    };

    // Initialize auth and store cleanup
    const cleanup: Promise<() => void> = initializeAuth();

    // Cleanup on unmount
    return () => {
      cleanup.then((unsubscribe: () => void) => unsubscribe?.());
    };
  }, []);


  // During SSR and initial hydration, render only children to avoid "window is not defined" errors
  if (!isMounted || !authChecked) {
    return <>{children}</>;
  }

  // If auth is checked but noconversationid, render without notification provider
  if (!userId) {
    return (
      <TooltipProvider>
        <FirebaseInitializer>
          {children}
          <PwaStatusToast />
        </FirebaseInitializer>
      </TooltipProvider>
    );
  }

  // User is authenticated, render with notification provider
  return (
    <TooltipProvider>
      <NotificationProvider recipientId={userId}>
        <FirebaseInitializer>
          {children}
          <PwaStatusToast />
        </FirebaseInitializer>
      </NotificationProvider>
    </TooltipProvider>
  );
}