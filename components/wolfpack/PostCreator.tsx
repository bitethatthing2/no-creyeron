'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { CameraView } from './PostCreator/CameraView';
import { RecordingControls } from './PostCreator/RecordingControls';
import { CaptionInput } from './PostCreator/CaptionInput';
import { useCamera } from '@/lib/hooks/wolfpack/useCamera';
import { useRecording } from '@/lib/hooks/wolfpack/useRecording';
import { useMediaUpload } from '@/lib/hooks/wolfpack/useMediaUpload';
import { useAuth } from '@/contexts/AuthContext';

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

enum CreatorStep {
  CAMERA = 'camera',
  CAPTION = 'caption'
}

export function PostCreator({ isOpen, onClose, onSuccess }: PostCreatorProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = React.useState<CreatorStep>(CreatorStep.CAMERA);
  const [caption, setCaption] = React.useState('');
  const [mediaUrl, setMediaUrl] = React.useState('');
  
  // Camera and recording hooks
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
    recordingDuration,
    setRecordingMode,
    startRecording,
    stopRecording,
    capturePhoto,
    hasRecording,
    recordingUrl,
    resetRecording
  } = useRecording(videoRef);

  const { posting, createPost } = useMediaUpload();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setStep(CreatorStep.CAMERA);
      setCaption('');
      setMediaUrl('');
      setPosting(false);
      resetRecording();
    } else {
      stopCamera();
      resetRecording();
    }
  }, [isOpen, stopCamera, resetRecording]);

  // Update media URL when recording is available
  React.useEffect(() => {
    if (recordingUrl) {
      setMediaUrl(recordingUrl);
      setStep(CreatorStep.CAPTION);
    }
  }, [recordingUrl]);

  const handleMainAction = React.useCallback(() => {
    if (recordingMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [recordingMode, isRecording, capturePhoto, startRecording, stopRecording]);

  const handleRetake = React.useCallback(() => {
    resetRecording();
    setMediaUrl('');
    setStep(CreatorStep.CAMERA);
  }, [resetRecording]);

  const handlePost = React.useCallback(async () => {
    if (!mediaUrl || !caption.trim() || !currentUser || posting) return;

    try {
      // Convert data URL to blob for upload
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      
      await createPost({
        capturedMedia: blob,
        caption: caption.trim(),
        recordingMode,
        recordingTime: recordingDuration
      });

      onSuccess();
    } catch (error) {
      console.error('Error posting content:', error);
      // Error handling is done within the createPost hook
    }
  }, [mediaUrl, caption, currentUser, posting, recordingMode, recordingDuration, createPost, onSuccess]);

  const handleClose = React.useCallback(() => {
    if (posting) return;
    onClose();
  }, [posting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">
              {step === CreatorStep.CAMERA ? 'Create Post' : 'Add Caption'}
            </h2>
            <button
              onClick={handleClose}
              disabled={posting}
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full">
          {step === CreatorStep.CAMERA ? (
            <>
              {/* Camera View */}
              <div className="h-full">
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
              </div>

              {/* Recording Controls - Overlay at bottom */}
              <div className="absolute bottom-8 left-0 right-0 px-8">
                <RecordingControls
                  recordingMode={recordingMode}
                  isRecording={isRecording}
                  hasStream={hasStream}
                  recordingDuration={recordingDuration}
                  onModeChange={setRecordingMode}
                  onMainAction={handleMainAction}
                  onCancel={stopRecording}
                  isProcessing={posting}
                />
              </div>
            </>
          ) : (
            /* Caption Input */
            <CaptionInput
              caption={caption}
              mediaUrl={mediaUrl}
              recordingMode={recordingMode}
              posting={posting}
              onCaptionChange={setCaption}
              onRetake={handleRetake}
              onPost={handlePost}
            />
          )}
        </div>
      </div>
    </div>
  );
}