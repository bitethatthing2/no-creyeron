'use client';

import * as React from 'react';
import { Camera, Video, Square, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the type locally to avoid import issues
type RecordingMode = 'photo' | 'video';

interface RecordingControlsProps {
  recordingMode: RecordingMode;
  isRecording: boolean;
  hasStream: boolean;
  recordingDuration: number;
  onModeChange: (mode: RecordingMode) => void;
  onMainAction: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

function RecordingControlsComponent({
  recordingMode,
  isRecording,
  hasStream,
  recordingDuration,
  onModeChange,
  onMainAction,
  onCancel,
  isProcessing = false
}: RecordingControlsProps): React.ReactElement {
  
  const formatDuration = React.useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Recording Duration Display - Only show when recording video */}
      {isRecording && recordingMode === 'video' && (
        <div className="flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Mode Selector - Only show when not recording */}
      {!isRecording && (
        <div className="flex justify-center">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-1 flex gap-1">
            {/* Photo Mode */}
            <button
              type="button"
              onClick={() => onModeChange('photo')}
              disabled={isProcessing}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center",
                recordingMode === 'photo' 
                  ? "bg-white text-black" 
                  : "text-white/70 hover:text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-pressed={recordingMode === 'photo'}
              aria-label="Switch to photo mode"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photo
            </button>

            {/* Video Mode */}
            <button
              type="button"
              onClick={() => onModeChange('video')}
              disabled={isProcessing}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center",
                recordingMode === 'video' 
                  ? "bg-white text-black" 
                  : "text-white/70 hover:text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-pressed={recordingMode === 'video'}
              aria-label="Switch to video mode"
            >
              <Video className="w-4 h-4 mr-2" />
              Video
            </button>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex justify-center items-center gap-6">
        {/* Cancel button - Only show when recording */}
        {isRecording && (
          <button
            type="button"
            onClick={onCancel}
            className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all"
            aria-label="Cancel recording"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Main Record Button */}
        <button
          type="button"
          onClick={onMainAction}
          disabled={!hasStream || isProcessing}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all transform",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "active:scale-95",
            !hasStream 
              ? "bg-gray-600" 
              : recordingMode === 'photo'
                ? "bg-white hover:bg-gray-100 shadow-lg"
                : isRecording 
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg"
          )}
          aria-label={
            recordingMode === 'photo' 
              ? "Take photo" 
              : isRecording 
                ? "Stop recording" 
                : "Start recording"
          }
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : recordingMode === 'photo' ? (
            <Camera className="w-8 h-8 text-black" />
          ) : isRecording ? (
            <Square className="w-6 h-6 text-white fill-current" />
          ) : (
            <Circle className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      {/* Instructions */}
      {!isRecording && hasStream && (
        <div className="text-center">
          <p className="text-white/60 text-xs">
            {recordingMode === 'photo' 
              ? 'Tap to take photo' 
              : 'Tap to start recording'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export const RecordingControls = React.memo(RecordingControlsComponent);