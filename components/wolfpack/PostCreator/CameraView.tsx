'use client';

import * as React from 'react';
import { Camera, SwitchCamera, AlertCircle } from 'lucide-react';
import { CameraStatus, FacingMode } from '@/lib/hooks/wolfpack/useCamera';
import { cn } from '@/lib/utils';
import styles from './PostCreator.module.css';

interface CameraViewProps {
  hasStream: boolean;
  cameraStatus: CameraStatus;
  errorMessage: string;
  facingMode: FacingMode;
  onStartCamera: () => void;
  onSwitchCamera?: () => void;
  isProcessing?: boolean;
}

const CameraViewComponent = React.forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ 
    hasStream, 
    cameraStatus, 
    errorMessage, 
    facingMode, 
    onStartCamera,
    onSwitchCamera,
    isProcessing = false
  }, ref) => {
    
    // Render the video stream when available
    if (hasStream) {
      return (
        <div className="relative w-full h-full">
          <video
            ref={ref}
            autoPlay
            playsInline
            muted
            className={cn(
              styles.cameraVideo,
              facingMode === 'user' ? styles.cameraVideoFlipped : styles.cameraVideoNormal
            )}
          />
          
          {/* Camera Switch Button - Overlay on video */}
          {onSwitchCamera && (
            <button
              onClick={onSwitchCamera}
              disabled={isProcessing}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:bg-black/50 disabled:opacity-50"
              aria-label="Switch camera"
            >
              <SwitchCamera className="w-6 h-6 text-white" />
            </button>
          )}
          
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      );
    }

    // Render loading/error states when no stream
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center space-y-6 max-w-sm mx-auto p-6">
          {/* Status Icon */}
          <div className="relative">
            {cameraStatus === 'error' ? (
              <AlertCircle className="w-20 h-20 mx-auto text-red-400 animate-pulse" />
            ) : (
              <Camera className="w-20 h-20 mx-auto text-white/30" />
            )}
          </div>
          
          {/* Loading State */}
          {cameraStatus === 'loading' && (
            <div className="space-y-3">
              <div className="animate-spin w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-white font-medium">Starting camera...</p>
              <p className="text-white/60 text-sm">Please allow camera access</p>
            </div>
          )}
          
          {/* Error State */}
          {cameraStatus === 'error' && (
            <div className="space-y-3">
              <p className="text-red-400 font-semibold text-lg">Camera Error</p>
              <p className="text-white/80 text-sm leading-relaxed">
                {errorMessage || 'Unable to access camera'}
              </p>
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mt-4">
                <p className="text-white/60 text-xs">
                  Make sure you&apos;ve granted camera permissions in your browser settings
                </p>
              </div>
            </div>
          )}
          
          {/* Idle State */}
          {cameraStatus === 'idle' && (
            <div className="space-y-3">
              <p className="text-white font-medium">Ready to capture</p>
              <p className="text-white/60 text-sm">
                Tap the button below to start your camera
              </p>
            </div>
          )}
          
          {/* Start Camera Button */}
          <button
            onClick={onStartCamera}
            disabled={cameraStatus === 'loading'}
            className={`
              relative px-8 py-4 rounded-full font-semibold text-white
              transition-all duration-300 transform
              ${cameraStatus === 'loading' 
                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                : cameraStatus === 'error'
                  ? 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }
            `}
          >
            <span className="relative z-10">
              {cameraStatus === 'loading' 
                ? 'Starting...' 
                : cameraStatus === 'error'
                  ? 'Retry Camera'
                  : 'Start Camera'
              }
            </span>
            {cameraStatus !== 'loading' && (
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

CameraViewComponent.displayName = 'CameraView';

export const CameraView = React.memo(CameraViewComponent);