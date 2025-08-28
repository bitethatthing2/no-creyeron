'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { SimpleVideoPlayer } from '@/components/ui/VideoPlayer';

interface WatchItMadeModalProps {
  videoUrl: string;
  itemName: string;
  onCloseAction: () => void;
}

export default function WatchItMadeModal({ videoUrl, itemName, onCloseAction }: WatchItMadeModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseAction();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCloseAction();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [onCloseAction]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Watch It Made: {itemName}</h2>
          <button
            onClick={onCloseAction}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          <SimpleVideoPlayer
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay={true}
            loop={true}
            onError={(e) => {
              console.error('Video failed to load:', videoUrl, e);
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800 text-center">
          <p className="text-gray-300 text-sm">
            See how we prepare {itemName} fresh in our kitchen!
          </p>
        </div>
      </div>
    </div>
  );
}