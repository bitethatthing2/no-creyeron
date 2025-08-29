'use client';

import * as React from 'react';
import Image from 'next/image';
import { Send, RotateCcw, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the type locally to avoid import issues
type RecordingMode = 'photo' | 'video';

interface CaptionInputProps {
  caption: string;
  mediaUrl: string;
  recordingMode: RecordingMode;
  posting: boolean;
  onCaptionChange: (caption: string) => void;
  onRetake: () => void;
  onPost: () => void;
}

function CaptionInputComponent({
  caption,
  mediaUrl,
  recordingMode,
  posting,
  onCaptionChange,
  onRetake,
  onPost
}: CaptionInputProps): React.ReactElement {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Auto-play video preview on mount
  React.useEffect(() => {
    if (recordingMode === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay failures - browser policy
      });
    }
  }, [recordingMode]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Header with Media Preview */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          {/* Media Preview */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
            {recordingMode === 'photo' ? (
              <Image
                src={mediaUrl}
                alt="Photo preview"
                fill
                className="object-cover"
                sizes="96px"
                priority
              />
            ) : (
              <video 
                ref={videoRef}
                src={mediaUrl} 
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                controls={false}
              />
            )}
            {/* Media type indicator */}
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {recordingMode === 'photo' ? 'Photo' : 'Video'}
            </div>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h2 className="text-white font-semibold text-xl">Add Caption</h2>
            <p className="text-white/60 text-sm">
              Share your {recordingMode} with the Wolf Pack
            </p>
          </div>
        </div>
      </div>

      {/* Caption Input Area */}
      <div className="flex-1 p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <Type className="w-5 h-5 text-purple-400 mt-3 flex-shrink-0" />
            <div className="flex-1">
              <label htmlFor="caption-input" className="sr-only">
                Caption for your post
              </label>
              <textarea
                id="caption-input"
                value={caption}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder="What's happening in the Wolf Pack?"
                className="w-full bg-transparent text-white placeholder-white/50 resize-none border-none outline-none text-base leading-relaxed min-h-[120px]"
                maxLength={500}
                disabled={posting}
              />
              
              {/* Character count */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                <div className={cn(
                  "text-xs",
                  caption.length > 450 ? "text-yellow-400" : "text-white/50"
                )}>
                  {caption.length}/500 characters
                </div>
                {caption.length > 450 && (
                  <div className="text-yellow-400 text-xs">
                    Almost at limit
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Add a caption to describe your {recordingMode}
          </p>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-4">
          {/* Retake Button */}
          <button
            type="button"
            onClick={onRetake}
            disabled={posting}
            className={cn(
              "flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
              "bg-white/10 text-white hover:bg-white/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Retake photo or video"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Retake</span>
          </button>

          {/* Post Button */}
          <button
            type="button"
            onClick={onPost}
            disabled={posting || !caption.trim()}
            className={cn(
              "flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
              "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600"
            )}
            aria-label="Post to feed"
          >
            {posting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
        
        {/* Validation message */}
        {!caption.trim() && !posting && (
          <p className="text-center text-yellow-400/70 text-sm mt-3">
            Add a caption to share your {recordingMode}
          </p>
        )}
      </div>
    </div>
  );
}

export const CaptionInput = React.memo(CaptionInputComponent);