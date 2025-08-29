'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { CameraView } from './PostCreator/CameraView';
import { RecordingControls } from './PostCreator/RecordingControls';
import { CaptionInput } from './PostCreator/CaptionInput';
import { useCamera } from '@/lib/hooks/wolfpack/useCamera';
import { useRecording, type RecordingMode } from '@/lib/hooks/wolfpack/useRecording';
import { useMediaUpload } from '@/lib/hooks/wolfpack/useMediaUpload';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Type definitions
 */
type CreatorStep = 'camera' | 'caption';

interface CreatePostPayload {
  capturedMedia: Blob;
  caption: string;
  recordingMode: RecordingMode;
  recordingTime: number;
}

interface PostCreatorProps {
  readonly isOpen: boolean;
  readonly onCloseAction: () => void;
  readonly onSuccessAction: () => void;
}

/**
 * PostCreator Component
 * 
 * A modal component for creating posts with camera functionality.
 * Supports both photo and video recording with caption input.
 */
export function PostCreator({ 
  isOpen, 
  onCloseAction, 
  onSuccessAction 
}: PostCreatorProps): React.ReactElement | null {
  // State management
  const [step, setStep] = React.useState<CreatorStep>('camera');
  const [caption, setCaption] = React.useState<string>('');
  
  // Hooks
  const { currentUser } = useAuth();
  const {
    videoRef,
    hasStream,
    cameraStatus,
    errorMessage,
    facingMode,
    startCamera,
    switchCamera,
    stopCamera
  } = useCamera();

  const {
    recordingMode,
    isRecording,
    recordingTime,
    capturedMedia,
    mediaUrl,
    setRecordingMode,
    startRecording,
    stopRecording,
    takePhoto,
    resetMedia
  } = useRecording();

  const { posting, createPost } = useMediaUpload();

  /**
   * Reset component state when modal opens/closes
   */
  React.useEffect(() => {
    if (isOpen) {
      setStep('camera');
      setCaption('');
      resetMedia();
    } else {
      stopCamera();
      resetMedia();
    }
  }, [isOpen, stopCamera, resetMedia]);

  /**
   * Update step when media is captured
   */
  React.useEffect(() => {
    if (capturedMedia && mediaUrl) {
      setStep('caption');
    }
  }, [capturedMedia, mediaUrl]);

  /**
   * Handle main recording action (photo capture or video start/stop)
   */
  const handleMainAction = React.useCallback((): void => {
    if (recordingMode === 'photo') {
      if (videoRef.current) {
        takePhoto(videoRef.current);
      }
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        const stream = videoRef.current?.srcObject as MediaStream | null;
        if (stream) {
          startRecording(stream);
        }
      }
    }
  }, [recordingMode, isRecording, takePhoto, startRecording, stopRecording, videoRef]);

  /**
   * Handle retaking media - reset to camera step
   */
  const handleRetake = React.useCallback((): void => {
    resetMedia();
    setStep('camera');
  }, [resetMedia]);

  /**
   * Handle post creation submission
   */
  const handlePost = React.useCallback(async (): Promise<void> => {
    // Guard clauses for validation
    if (!capturedMedia || !caption.trim() || !currentUser || posting) {
      return;
    }

    try {
      const payload: CreatePostPayload = {
        capturedMedia,
        caption: caption.trim(),
        recordingMode,
        recordingTime
      };

      await createPost(payload);
      onSuccessAction();
    } catch (error) {
      console.error('Error posting content:', error);
      // Error handling is managed within the createPost hook
    }
  }, [
    capturedMedia, 
    caption, 
    currentUser, 
    posting, 
    recordingMode, 
    recordingTime, 
    createPost, 
    onSuccessAction
  ]);

  /**
   * Handle modal close - prevent closing while posting
   */
  const handleClose = React.useCallback((): void => {
    if (posting) return;
    onCloseAction();
  }, [posting, onCloseAction]);

  // Early return if modal is not open
  if (!isOpen) {
    return null;
  }

  const isOnCameraStep = step === 'camera';
  const headerTitle = isOnCameraStep ? 'Create Post' : 'Add Caption';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto bg-black">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">
              {headerTitle}
            </h2>
            <button
              onClick={handleClose}
              disabled={posting}
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              aria-label="Close post creator"
            >
              <X className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="h-full">
          {isOnCameraStep ? (
            <>
              {/* Camera View */}
              <section className="h-full" aria-label="Camera view">
                <CameraView
                  ref={videoRef}
                  hasStream={hasStream}
                  cameraStatus={cameraStatus}
                  errorMessage={errorMessage}
                  facingMode={facingMode}
                  onStartCamera={startCamera}
                  onSwitchCamera={switchCamera}
                  isProcessing={posting}
                />
              </section>

              {/* Recording Controls - Fixed overlay at bottom */}
              <section 
                className="absolute bottom-8 left-0 right-0 px-8"
                aria-label="Recording controls"
              >
                <RecordingControls
                  recordingMode={recordingMode}
                  isRecording={isRecording}
                  hasStream={hasStream}
                  recordingDuration={recordingTime}
                  onModeChange={setRecordingMode}
                  onMainAction={handleMainAction}
                  onCancel={stopRecording}
                  isProcessing={posting}
                />
              </section>
            </>
          ) : (
            /* Caption Input Step */
            <section className="h-full" aria-label="Caption input">
              <CaptionInput
                caption={caption}
                mediaUrl={mediaUrl}
                recordingMode={recordingMode}
                posting={posting}
                onCaptionChange={setCaption}
                onRetake={handleRetake}
                onPost={handlePost}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}