'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFeature } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/services/feature-flags.service';
import { useCamera } from '@/hooks/wolfpack/useCamera';
import { useRecording } from '@/hooks/wolfpack/useRecording';
import { useMediaUpload } from '@/hooks/wolfpack/useMediaUpload';
import { CameraView } from './PostCreator/CameraView';
import { RecordingControls } from './PostCreator/RecordingControls';
import { CaptionInput } from './PostCreator/CaptionInput';
import { PostCreatorProps } from '@/types/wolfpack';

export function PostCreator({ isOpen, onClose, onSuccess }: PostCreatorProps) {
  const { user } = useAuth();
  
  // Feature flag integration
  const { hasAccess: canUploadwolfpack_videos, loading: featureLoading, error: featureError } = 
    useAuthenticatedFeature(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
  
  // Custom hooks
  const camera = useCamera({ facingMode: 'user', audio: true });
  const recording = useRecording({ maxDuration: 60 });
  const { posting, createPost } = useMediaUpload();
  
  // Local states
  const [caption, setCaption] = useState<string>('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set error message based on feature flag status
  useEffect(() => {
    if (featureError) {
      setErrorMessage(featureError);
    } else if (!canUploadwolfpack_videos && !featureLoading) {
      setErrorMessage('Video uploads are currently disabled for your account');
    } else if (camera.errorMessage) {
      setErrorMessage(camera.errorMessage);
    } else {
      setErrorMessage('');
    }
  }, [canUploadwolfpack_videos, featureLoading, featureError, camera.errorMessage]);
  
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    // Use the new updateVideoElement function from the camera hook
    camera.updateVideoElement(element);
  }, [camera]);

  useEffect(() => {
    if (isOpen && !camera.streamRef.current) {
      console.log('Opening camera...');
      camera.startCamera();
    } else if (!isOpen) {
      console.log('Closing camera...');
      camera.stopCamera();
    }
  }, [isOpen]);

  // Hook up recording media updates
  useEffect(() => {
    if (recording.mediaUrl) {
      setShowCaptionInput(true);
    }
  }, [recording.mediaUrl]);

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = false; // Single file upload
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('File selected:', file);
        // Convert file to blob and set as captured media
        const blob = new Blob([file], { type: file.type });
        // You would need to update the recording hook to handle external files
        console.log('File upload not yet implemented');
      }
    };
    
    input.click();
  }, []);

  const handleMainAction = useCallback(() => {
    if (recording.recordingMode === 'photo' && videoRef.current) {
      recording.takePhoto(videoRef.current);
    } else {
      if (recording.isRecording) {
        recording.stopRecording();
      } else if (camera.streamRef.current) {
        recording.startRecording(camera.streamRef.current);
      }
    }
  }, [recording, camera.streamRef]);

  const handlePost = useCallback(async () => {
    if (!recording.capturedMedia) return;

    const postData = await createPost({
      capturedMedia: recording.capturedMedia,
      caption,
      recordingMode: recording.recordingMode,
      recordingTime: recording.recordingTime
    });

    // Only proceed if post was successful
    if (postData) {
      // Call success callback with the new post data
      if (onSuccess) {
        onSuccess(postData);
      }

      // Reset state and close
      resetState();
      onClose();
    }
  }, [recording.capturedMedia, createPost, caption, recording.recordingMode, recording.recordingTime, onSuccess, onClose]);

  const resetState = useCallback(() => {
    recording.resetMedia();
    setCaption('');
    setShowCaptionInput(false);
  }, [recording]);

  const handleRetake = useCallback(() => {
    resetState();
  }, [resetState]);

  if (!isOpen) return null;

  console.log('🎬 RENDER STATE:', {
    isOpen,
    hasStream: camera.hasStream,
    videoRefExists: !!videoRef.current,
    streamRefExists: !!camera.streamRef.current
  });

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Full-screen camera view */}
      <div className="relative w-full h-full">
        {/* Camera View */}
        <CameraView
          ref={setVideoRef}
          hasStream={camera.hasStream}
          cameraStatus={camera.cameraStatus}
          errorMessage={errorMessage}
          facingMode={camera.facingMode}
          onStartCamera={camera.startCamera}
        />
        
        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 z-10">
          {/* Close button and duration selector */}
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Duration options */}
            <div className="flex gap-2">
              {[15, 60, 180].map((duration) => (
                <button
                  key={duration}
                  onClick={() => recording.setMaxDuration(duration)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    recording.maxDuration === duration 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-black/30 text-white'
                  }`}
                >
                  {duration < 60 ? `${duration}s` : `${duration/60}m`}
                </button>
              ))}
            </div>
            
            <button 
              onClick={camera.switchCamera}
              disabled={!camera.hasStream}
              className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          {/* Recording progress bar */}
          {recording.isRecording && (
            <div className="px-4">
              <div className="w-full h-1 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-100 ease-linear"
                  style={{ width: `${recording.recordingProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Recording timer */}
          {recording.isRecording && (
            <div className="absolute top-16 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">
                {Math.floor(recording.recordingTime / 60)}:{(recording.recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        
        {/* Side controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
          {/* Upload from gallery */}
          <button
            onClick={handleUpload}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <Upload className="w-6 h-6" />
          </button>
          
          {/* Speed control */}
          <button
            onClick={() => {
              const speeds = [0.5, 1, 1.5, 2];
              const currentIndex = speeds.indexOf(playbackSpeed);
              const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
              setPlaybackSpeed(nextSpeed);
            }}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <div className="text-xs font-bold">{playbackSpeed}x</div>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
          {showCaptionInput ? (
            <CaptionInput
              caption={caption}
              mediaUrl={recording.mediaUrl}
              recordingMode={recording.recordingMode}
              posting={posting}
              onCaptionChange={setCaption}
              onRetake={handleRetake}
              onPost={handlePost}
            />
          ) : (
            <RecordingControls
              recordingMode={recording.recordingMode}
              isRecording={recording.isRecording}
              hasStream={camera.hasStream}
              onModeChange={recording.setRecordingMode}
              onMainAction={handleMainAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}