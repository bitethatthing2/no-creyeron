'use client';

import { useEffect, useState, useRef } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 
import { Loader2 } from 'lucide-react';

// Global flag to prevent multiple initializations across component instances
let hasInitializedFirebase = false;

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Skip if already initialized or attempted to prevent duplicate initialization
    if (hasInitializedFirebase || initAttempted.current) {
      console.log('Firebase already initialized or initialization attempted');
      return;
    }
    
    // Mark as attempted immediately to prevent race conditions
    initAttempted.current = true;
    
    // Initialize Firebase as early as possible
    const initializeFirebase = async () => {
      setIsInitializing(true);
      
      try {
        // Check if service worker is already registered and active
        const isServiceWorkerActive = 'serviceWorker' in navigator && 
                                     navigator.serviceWorker.controller !== null;
        
        // If service worker is not yet active, wait a moment to give it time to initialize
        // But don't wait too long as this could block Firebase initialization
        if (!isServiceWorkerActive && 'serviceWorker' in navigator) {
          console.log('Waiting briefly for service worker to activate...');
          
          // Wait for service worker to be ready, but with a timeout
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
          ]);
        }
        
        // Initialize Firebase
        await initFirebase();
        console.log('Firebase initialized successfully');
        hasInitializedFirebase = true;
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setInitError(error instanceof Error ? error.message : String(error));
        // Don't reset the global flag - we'll consider it initialized even with error
        // to prevent multiple initialization attempts
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeFirebase();
  }, []);

  return (
    <FcmProvider>
      {isInitializing && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-md shadow-md p-2 z-50 flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Initializing notifications...</span>
        </div>
      )}
      
      {initError && (
        <div className="fixed bottom-4 right-4 bg-destructive/10 border border-destructive rounded-md shadow-md p-2 z-50 text-xs">
          <p>Notification system error</p>
          <p className="text-destructive">{initError}</p>
        </div>
      )}
      
      {children}
      <Toaster 
        theme="light"
        position="top-right"
        expand={false}
        richColors
        duration={8000}
        visibleToasts={3}
      />
    </FcmProvider>
  );
}
