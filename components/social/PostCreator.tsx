'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { CameraView } from './PostCreator/CameraView';
import { RecordingControls } from './PostCreator/RecordingControls';
import { CaptionInput } from './PostCreator/CaptionInput';
import { useCamera } from '@/lib/hooks/useCamera';
import { useRecording } from '@/lib/hooks/useRecording';
import { useMediaUpload } from '@/lib/hooks/useMediaUpload';
import { useAuth } from '@/contexts/AuthContext';
import styles from './PostCreator/PostCreator.module.css';

/**
 * Type definitions
 */
type CreatorStep = 'camera' | 'caption';

interface CreatePostPayload {
  capturedMedia: Blob;
  caption: string;
  isVideo: boolean;
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
    errorMessage: cameraError,
    facingMode,
    startCamera,
    switchCamera,
    stopCamera
  } = useCamera();

  // Use the actual interface from useRecording hook
  const {
    isRecording,
    recordingStatus,
    recordingMode,
    recordedBlob,
    recordingDuration,
    errorMessage: recordingError,
    startRecording,
    stopRecording,
    capturePhoto,
    setRecordingMode,
    reset: resetRecording
  } = useRecording();

  const { 
    createPost,
    uploadStatus,
    uploadProgress,
    errorMessage: uploadError
  } = useMediaUpload();

  // Derived state
  const isUploading = uploadStatus === 'uploading';
  const hasError = !!(cameraError || recordingError || uploadError);
  const mediaUrl = React.useMemo(() => {
    if (recordedBlob) {
      return URL.createObjectURL(recordedBlob);
    }
    return null;
  }, [recordedBlob]);

  // Cleanup media URL on unmount
  React.useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  /**
   * Reset component state when modal opens/closes
   */
  React.useEffect(() => {
    if (isOpen) {
      console.log('[PostCreator] Modal opened - resetting state and starting camera');
      setStep('camera');
      setCaption('');
      resetRecording();
      // Auto-start camera when modal opens - don't include startCamera in deps to avoid loop
      startCamera().catch((err) => {
        console.error('[PostCreator] Failed to start camera:', err);
      });
    } else {
      console.log('[PostCreator] Modal closed - stopping camera');
      stopCamera();
      resetRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stopCamera, resetRecording]); // Removed startCamera from deps to prevent infinite loop

  /**
   * Update step when media is captured
   */
  React.useEffect(() => {
    if (recordedBlob && recordingStatus === 'completed') {
      setStep('caption');
    }
  }, [recordedBlob, recordingStatus]);

  /**
   * Handle main recording action (photo capture or video start/stop)
   */
  const handleMainAction = React.useCallback((): void => {
    if (recordingMode === 'photo') {
      if (videoRef.current) {
        capturePhoto(videoRef.current);
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
  }, [recordingMode, isRecording, capturePhoto, startRecording, stopRecording, videoRef]);

  /**
   * Handle retaking media - reset to camera step
   */
  const handleRetake = React.useCallback((): void => {
    resetRecording();
    setStep('camera');
  }, [resetRecording]);

  /**
   * Handle post creation submission
   */
  const handlePost = React.useCallback(async (): Promise<void> => {
    // Guard clauses for validation
    if (!recordedBlob || !caption.trim() || !currentUser || isUploading) {
      return;
    }

    try {
      const payload: CreatePostPayload = {
        capturedMedia: recordedBlob,
        caption: caption.trim(),
        isVideo: recordingMode === 'video'
      };

      const success = await createPost(payload);
      if (success) {
        onSuccessAction();
      }
    } catch (error) {
      console.error('Error posting content:', error);
    }
  }, [
    recordedBlob, 
    caption, 
    currentUser, 
    isUploading, 
    recordingMode,
    createPost, 
    onSuccessAction
  ]);

  /**
   * Handle modal close - prevent closing while uploading
   */
  const handleClose = React.useCallback((): void => {
    if (isUploading) return;
    onCloseAction();
  }, [isUploading, onCloseAction]);

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
              disabled={isUploading}
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
                  errorMessage={cameraError}
                  facingMode={facingMode}
                  onStartCamera={startCamera}
                  onSwitchCamera={switchCamera}
                  isProcessing={isUploading}
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
                  recordingDuration={recordingDuration}
                  onModeChange={setRecordingMode}
                  onMainAction={handleMainAction}
                  onCancel={stopRecording}
                  isProcessing={isUploading}
                />
              </section>
            </>
          ) : (
            /* Caption Input Step */
            <section className="h-full" aria-label="Caption input">
              <CaptionInput
                caption={caption}
                mediaUrl={mediaUrl ?? ''}
                recordingMode={recordingMode}
                posting={isUploading}
                onCaptionChange={setCaption}
                onRetake={handleRetake}
                onPost={handlePost}
              />
            </section>
          )}
        </main>

        {/* Upload Progress Indicator */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div 
              className={styles.uploadProgressBar}
              data-progress={Math.round(uploadProgress / 5) * 5}
            />
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg">
            <p className="text-sm">
              {cameraError || recordingError || uploadError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}