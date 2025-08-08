import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { DownloadIcon, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastAction } from '@/components/ui/toast';
import {
  showInstallPrompt,
  isInstalled,
  isPromptAvailable, // Re-added this import as it was present in the original problem statement
  onBeforeInstallPrompt,
  onAppInstalled
} from '@/lib/pwa/pwaEventHandler';

interface PwaInstallGuideProps {
  className?: string;
  fullButton?: boolean;
}

export function PwaInstallGuide({ className, fullButton = false }: PwaInstallGuideProps) {
  const [appInstalled, setAppInstalled] = useState(false);
  const [promptAvailable, setPromptAvailable] = useState(false); // Re-added this state
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // Track if we've finished initializing

  // Handle installation button click
  const handleInstallClick = async () => {
    console.log('[PWA Install] Install button clicked');

    if (isInstalling) return; // Prevent double clicks

    setIsInstalling(true);

    try {
      // Small delay to ensure DOM is stable after routing
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = await showInstallPrompt();

      console.log('[PWA Install] Installation result:', result);

      if (result === 'accepted') {
        toast({
          title: "🎉 Installation Started!",
          description: "The app is being installed to your device",
          duration: 3000,
        });
      } else if (result === 'dismissed') {
        toast({
          title: "Installation Cancelled",
          description: "You can install the app anytime by clicking this button again",
          duration: 3000,
        });
      } else if (result === 'unavailable') {
        if (isIOS) {
          // For iOS devices, show Add to Home Screen instructions
          toast({
            title: "Install on iOS",
            description: "Tap the Share icon (⎋), then 'Add to Home Screen'",
            duration: 8000,
            action: <ToastAction altText="Dismiss">Got it</ToastAction>,
          });
        } else {
          toast({
            title: "Installation Not Available",
            description: "Try refreshing the page or check back later. Some browsers require you to visit the site multiple times first.",
            variant: "destructive",
            duration: 6000,
          });
        }
      }
    } catch (error) {
      console.error('[PWA Install] Error during installation:', error);
      toast({
        title: "Installation Failed",
        description: "There was an error installing the app. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Initialize PWA functionality and check status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[PWA Install] Checking PWA status');

    // Detect iOS devices
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) ||
                        (ua.includes('mac') && navigator.maxTouchPoints > 0);
    setIsIOS(isIOSDevice);

    // Check if already installed
    setAppInstalled(isInstalled());

    // Check if prompt is available
    setPromptAvailable(isPromptAvailable());

    // Register for PWA events
    type UnregisterCallback = () => void;

    const unregisterPrompt: UnregisterCallback = onBeforeInstallPrompt((event) => {
      console.log('[PWA Install] Install prompt became available', event);
      setPromptAvailable(true);
      setHasInitialized(true); // Ensure we show the button when prompt becomes available
    });

    const unregisterInstalled: UnregisterCallback = onAppInstalled(() => {
      console.log('[PWA Install] App was installed');
      setAppInstalled(true);
      toast({
      title: "🎉 App Installed Successfully!",
      description: "You can now access Side Hustle from your home screen",
      duration: 5000,
      action: <ToastAction altText="Awesome">Awesome!</ToastAction>,
      });
    });

    return (): void => {
      unregisterPrompt();
      unregisterInstalled();
    };
    }, []);

  // Set initialized after checking status to prevent layout shifts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true);
    }, 100); // Small delay to ensure all checks are complete
    
    return () => clearTimeout(timer);
  }, [appInstalled, promptAvailable, isIOS]);

  // Don't show the button if the app is already installed
  // Also, don't show if no prompt is available (unless it's iOS, where we give instructions)
  // Return invisible placeholder during initialization to prevent layout shifts
  if (!hasInitialized) {
    return (
      <div 
        className={cn("gap-2", fullButton ? "w-full" : "", className)}
        style={{ 
          height: fullButton ? '40px' : '36px', 
          width: fullButton ? '100%' : '100px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
    );
  }
  
  // In production, hide if already installed or no prompt available (except iOS)
  // In development, show a debug version
  if (appInstalled || (!promptAvailable && !isIOS)) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Button
          variant="outline"
          size={fullButton ? "default" : "sm"}
          className={cn("gap-2", fullButton ? "w-full" : "", className)}
          onClick={() => {
            console.log('[PWA Install Debug]', {
              appInstalled,
              promptAvailable,
              isIOS,
              hasInitialized
            });
            alert(`PWA Install Debug:\n\nApp Installed: ${appInstalled}\nPrompt Available: ${promptAvailable}\nIs iOS: ${isIOS}\nHas Initialized: ${hasInitialized}`);
          }}
        >
          <DownloadIcon className="h-4 w-4" />
          Install (Debug)
        </Button>
      );
    }
    return null;
  }

  return (
    <Button
      variant="default"
      size={fullButton ? "default" : "sm"}
      className={cn("gap-2", fullButton ? "w-full" : "", className)}
      onClick={handleInstallClick}
      disabled={isInstalling}
    >
      {isInstalling ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          Installing...
        </>
      ) : (
        <>
          {isIOS ? <Smartphone className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
          Install App
        </>
      )}
    </Button>
  );
}