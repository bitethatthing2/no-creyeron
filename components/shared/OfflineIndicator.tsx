'use client';

import { useState, useEffect } from "react";
import { useOffline } from "@/hooks/useOffline";
import { WifiOff, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = "" }: OfflineIndicatorProps) {
  const { isOnline, lastOnline, syncPending, syncItems } = useOffline();
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastOnlineText, setLastOnlineText] = useState<string>("");

  // Update last online text every minute
  useEffect(() => {
    if (!lastOnline) return;

    const updateLastOnlineText = () => {
      setLastOnlineText(
        formatDistanceToNow(new Date(lastOnline), { addSuffix: true })
      );
    };

    updateLastOnlineText();
    const interval = setInterval(updateLastOnlineText, 60000);

    return () => clearInterval(interval);
  }, [lastOnline]);

  // Don't show anything if online and no sync pending
  if (isOnline && !syncPending) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 bg-background text-foreground border border-input ${
              !isOnline ? "animate-pulse" : ""
            } ${className}`}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4 text-foreground" />
                <span className="text-xs">Offline</span>
              </>
            ) : syncPending ? (
              <>
                <RefreshCw className="h-4 w-4 text-foreground" />
                <span className="text-xs">Syncing ({syncItems})</span>
              </>
            ) : null}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-4 max-w-xs">
          <div className="space-y-2">
            {!isOnline ? (
              <>
                <h4 className="font-medium text-sm">You&apos;re offline</h4>
                <p className="text-xs text-muted-foreground">
                  Your changes will be saved locally and synced when you&apos;re back
                  online.
                </p>
                {lastOnline && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    <span>Last online: {lastOnlineText}</span>
                  </div>
                )}
              </>
            ) : syncPending ? (
              <>
                <h4 className="font-medium text-sm">Syncing data</h4>
                <p className="text-xs text-muted-foreground">
                  {syncItems} {syncItems === 1 ? "item" : "items"} waiting to be
                  synced to the server.
                </p>
              </>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
