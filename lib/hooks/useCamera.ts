'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'loading' | 'active' | 'error';
export type FacingMode = 'user' | 'environment';

interface CameraState {
  hasStream: boolean;
  cameraStatus: CameraStatus;
  errorMessage: string;
  facingMode: FacingMode;
  stream: MediaStream | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    hasStream: false,
    cameraStatus: 'idle',
    errorMessage: '',
    facingMode: 'user',
    stream: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async (facingMode?: FacingMode) => {
    setState(prev => ({ ...prev, cameraStatus: 'loading', errorMessage: '' }));
    
    try {
      const currentFacingMode = facingMode || state.facingMode;
      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState(prev => ({
        ...prev,
        hasStream: true,
        cameraStatus: 'active',
        stream,
        facingMode: currentFacingMode
      }));
    } catch (error) {
      console.error('Error starting camera:', error);
      setState(prev => ({
        ...prev,
        hasStream: false,
        cameraStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to start camera'
      }));
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user';
    setState(prev => ({ 
      ...prev, 
      hasStream: false,
      stream: null,
      cameraStatus: 'idle'
    }));

    // Wait a bit before starting the new camera
    setTimeout(() => {
      startCamera(newFacingMode);
    }, 100);
  }, [state.stream, state.facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      hasStream: false,
      cameraStatus: 'idle',
      stream: null
    }));
  }, [state.stream]);

  // Re-start camera when it becomes inactive but should be active
  useEffect(() => {
    if (state.cameraStatus === 'active' && !state.hasStream) {
      startCamera();
    }
  }, [state.cameraStatus, state.hasStream, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.stream]);

  return {
    ...state,
    videoRef,
    startCamera,
    switchCamera,
    stopCamera
  };
}