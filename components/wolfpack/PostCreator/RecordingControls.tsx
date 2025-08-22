'use client';

import * as React from 'react';
import { Camera, Video, Square, Circle, X, Zap, Timer } from 'lucide-react';
import { RecordingMode } from '@/lib/hooks/wolfpack/useRecording';
import { cn } from '@/lib/utils';
import styles from './PostCreator.module.css';

interface RecordingControlsProps {
  recordingMode: RecordingMode;
  isRecording: boolean;
  hasStream: boolean;
  onModeChange: (mode: RecordingMode) => void;
  onMainAction: () => void;
  recordingDuration?: number;
  maxDuration?: number;
  onCancel?: () => void;
  isProcessing?: boolean;
}

function RecordingControlsComponent({
  recordingMode,
  isRecording,
  hasStream,
  recordingDuration = 0,
  maxDuration = 60,
  onModeChange,
  onMainAction,
  onCancel,
  isProcessing = false
}: RecordingControlsProps) {
  
  const formatDuration = React.useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const durationPercentage = React.useMemo(() => {
    return Math.min((recordingDuration / maxDuration) * 100, 100);
  }, [recordingDuration, maxDuration]);

  return (
    <div className="space-y-6">
      {/* Recording Duration Display */}
      {isRecording && recordingMode === 'video' && (
        <div className="flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-white/50 text-xs">
              / {formatDuration(maxDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Mode Selector - Hide when recording */}
      {!isRecording && (
        <div className="flex justify-center">
          <div className={cn("shadow-lg", styles.modeSelector)}>
            <div className="flex gap-1">
              {/* Photo Mode */}
              <button
                onClick={() => onModeChange('photo')}
                disabled={isProcessing}
                className={cn(
                  styles.modeButton,
                  recordingMode === 'photo' ? styles.modeButtonActive : styles.modeButtonInactive,
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Camera className="w-4 h-4" />
                <span>Photo</span>
                {recordingMode === 'photo' && (
                  <div className={styles.modeButtonGlow} />
                )}
              </button>

              {/* Video Mode */}
              <button
                onClick={() => onModeChange('video')}
                disabled={isProcessing}
                className={cn(
                  styles.modeButton,
                  recordingMode === 'video' ? styles.modeButtonActive : styles.modeButtonInactive,
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
                {recordingMode === 'video' && (
                  <div className={styles.modeButtonGlow} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Record Button */}
      <div className="flex justify-center items-center gap-6">
        {/* Cancel button when recording */}
        {isRecording && onCancel && (
          <button
            onClick={onCancel}
            className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all"
            title="Cancel recording"
            aria-label="Cancel recording"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Main Action Button */}
        <div className="relative">
          {/* Progress Ring for Video Recording */}
          {isRecording && recordingMode === 'video' && (
            <svg className={styles.progressRing}>
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - durationPercentage / 100)}`}
                className={styles.progressCircle}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Outer Ring Animation */}
          <div className={cn(
            styles.recordButtonRing,
            isRecording
              ? styles.recordButtonRingRecording
              : hasStream
                ? styles.recordButtonRingActive
                : styles.recordButtonRingInactive
          )} />

          {/* Main Button */}
          <button
            onClick={onMainAction}
            disabled={!hasStream || isProcessing}
            className={cn(
              styles.recordButtonBase,
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                styles.recordButtonInner,
                recordingMode === 'photo'
                  ? hasStream
                    ? styles.recordButtonPhoto
                    : styles.recordButtonPhotoDisabled
                  : isRecording
                    ? styles.recordButtonVideoRecording
                    : hasStream
                      ? styles.recordButtonVideo
                      : styles.recordButtonVideoDisabled
              )}
            >
              {/* Button Icon */}
              {isProcessing ? (
                <div className={cn("w-6 h-6", styles.loadingSpinner)} />
              ) : recordingMode === 'photo' ? (
                <Camera className="w-8 h-8 text-black/80" />
              ) : isRecording ? (
                <Square className="w-6 h-6 text-white rounded" />
              ) : (
                <Circle className="w-8 h-8 text-white" />
              )}
            </div>

            {/* Flash Effect for Photo */}
            {recordingMode === 'photo' && !isProcessing && hasStream && (
              <Zap className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Timer Options for Video (when not recording) */}
        {recordingMode === 'video' && !isRecording && (
          <button
            className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-all"
            title="Timer"
          >
            <Timer className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Instructions */}
      {!isRecording && hasStream && (
        <div className="text-center">
          <p className="text-white/60 text-xs">
            {recordingMode === 'photo' 
              ? 'Tap to capture photo' 
              : 'Hold to record video'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export const RecordingControls = React.memo(RecordingControlsComponent);