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
  const isStartingRef = useRef<boolean>(false);
  const currentStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (requestedFacingMode?: FacingMode) => {
    console.log('[Camera] startCamera called with mode:', requestedFacingMode);
    console.log('[Camera] Current state:', state);
    console.log('[Camera] isStartingRef.current:', isStartingRef.current);
    console.log('[Camera] videoRef.current:', videoRef.current);
    
    // Prevent multiple simultaneous starts
    if (isStartingRef.current) {
      console.log('[Camera] Start already in progress, skipping...');
      return;
    }

    isStartingRef.current = true;
    console.log('[Camera] Setting state to loading...');
    setState(prev => ({ ...prev, cameraStatus: 'loading', errorMessage: '' }));
    
    try {
      // Clean up any existing stream first
      if (currentStreamRef.current) {
        console.log('[Camera] Cleaning up existing stream');
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }

      // Use requested facing mode or current state
      const targetFacingMode = requestedFacingMode || state.facingMode;
      console.log('[Camera] Target facing mode:', targetFacingMode);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      console.log('[Camera] Browser supports getUserMedia');
      
      const constraints = {
        video: {
          facingMode: targetFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: true
      };

      console.log('[Camera] Getting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera] Got stream:', stream);
      console.log('[Camera] Stream tracks:', stream.getTracks());
      
      // Store the stream reference
      currentStreamRef.current = stream;
      
      if (videoRef.current) {
        console.log('[Camera] Setting video srcObject, current srcObject:', videoRef.current.srcObject);
        videoRef.current.srcObject = stream;
        // Let the video element handle autoplay - don't force play()
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.controls = false;
        console.log('[Camera] Video element configured');
      } else {
        console.warn('[Camera] videoRef.current is null!');
      }

      console.log('[Camera] Setting state to active...');
      setState(prev => ({
        ...prev,
        hasStream: true,
        cameraStatus: 'active',
        stream,
        facingMode: targetFacingMode
      }));

      console.log('[Camera] Successfully started camera');
    } catch (error) {
      console.error('[Camera] Error starting camera:', error);
      let errorMessage = 'Failed to start camera';
      
      if (error instanceof Error) {
        console.log('[Camera] Error name:', error.name);
        console.log('[Camera] Error message:', error.message);
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        } else if (error.name === 'AbortError') {
          // Don't treat abort errors as failures - they're often from rapid starts/stops
          console.log('[Camera] Start was aborted - likely from rapid component updates');
          return;
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('[Camera] Setting error state:', errorMessage);
      setState(prev => ({
        ...prev,
        hasStream: false,
        cameraStatus: 'error',
        errorMessage
      }));
    } finally {
      isStartingRef.current = false;
      console.log('[Camera] startCamera finished, isStartingRef set to false');
    }
  }, [state.facingMode]);

  const switchCamera = useCallback(async () => {
    // Don't switch if already starting
    if (isStartingRef.current) {
      console.log('[Camera] Switch requested but start in progress');
      return;
    }

    console.log('[Camera] Switching camera');
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
    }

    const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user';
    setState(prev => ({ 
      ...prev, 
      hasStream: false,
      stream: null,
      cameraStatus: 'idle'
    }));

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Start new camera after a brief delay
    setTimeout(() => {
      startCamera(newFacingMode);
    }, 200);
  }, [state.facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    console.log('[Camera] Stopping camera');
    isStartingRef.current = false; // Cancel any pending starts
    
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Camera] Cleaning up on unmount');
      isStartingRef.current = false;
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    switchCamera,
    stopCamera
  };
}