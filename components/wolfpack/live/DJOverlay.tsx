'use client';

import { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveDJIndicator from './LiveDJIndicator';
import LiveEventIndicator from './LiveEventIndicator';
import LiveBroadcastIndicator from './LiveBroadcastIndicator';

interface DJOverlayProps {
  className?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export default function DJOverlay({ 
  className = '', 
  onClose, 
  isExpanded = false, 
  onToggleExpanded 
}: DJOverlayProps) {
  const [isDJLive, setIsDJLive] = useState(false);
  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  const [hasActiveBroadcasts, setHasActiveBroadcasts] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if there's any live activity
  const hasLiveActivity = isDJLive || hasLiveEvents || hasActiveBroadcasts;

  useEffect(() => {
    setShowDetails(isExpanded);
  }, [isExpanded]);

  const handleIndicatorClick = (type: string) => {
    if (onToggleExpanded) {
      onToggleExpanded();
    } else {
      setShowDetails(!showDetails);
    }
  };

  if (!hasLiveActivity) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-white font-semibold text-sm">Live Activity</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 h-6 w-6 text-gray-400 hover:text-white"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 h-6 w-6 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Live Indicators */}
        <div className="p-3 space-y-3">
          {/* DJ Live Indicator */}
          <LiveDJIndicator
            onClick={() => handleIndicatorClick('dj')}
            showDetails={showDetails}
          />

          {/* Live Event Indicator */}
          <LiveEventIndicator
            onClick={() => handleIndicatorClick('event')}
            showDetails={showDetails}
          />

          {/* Live Broadcast Indicator */}
          <LiveBroadcastIndicator
            onClick={() => handleIndicatorClick('broadcast')}
            showDetails={showDetails}
          />
        </div>

        {/* Expanded Actions */}
        {showDetails && (
          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={() => window.location.href = '/dj'}
              >
                DJ Dashboard
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={() => window.location.href = '/wolfpack/chat'}
              >
                Join Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}