'use client';

import { useState, useRef, useCallback } from 'react';

export type RecordingMode = 'video' | 'photo';
export type RecordingStatus = 'idle' | 'recording' | 'completed' | 'error';

interface RecordingState {
  isRecording: boolean;
  recordingStatus: RecordingStatus;
  recordingMode: RecordingMode;
  recordedBlob: Blob | null;
  recordingDuration: number;
  errorMessage: string;
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingStatus: 'idle',
    recordingMode: 'video',
    recordedBlob: null,
    recordingDuration: 0,
    errorMessage: ''
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        recordingStatus: 'recording',
        recordingDuration: 0,
        errorMessage: '',
        recordedBlob: null
      }));

      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9' // Fallback to vp8 if needed
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setState(prev => ({
          ...prev,
          isRecording: false,
          recordingStatus: 'completed',
          recordedBlob: blob
        }));
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({
          ...prev,
          isRecording: false,
          recordingStatus: 'error',
          errorMessage: 'Recording failed'
        }));
      };

      mediaRecorder.start(1000); // Record in 1-second chunks

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingDuration: prev.recordingDuration + 1
        }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        recordingStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to start recording'
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false
    }));
  }, [state.isRecording]);

  const capturePhoto = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setState(prev => ({ 
        ...prev, 
        recordingStatus: 'recording',
        errorMessage: ''
      }));

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(videoElement, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setState(prev => ({
            ...prev,
            recordingStatus: 'completed',
            recordedBlob: blob
          }));
        } else {
          setState(prev => ({
            ...prev,
            recordingStatus: 'error',
            errorMessage: 'Failed to capture photo'
          }));
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Error capturing photo:', error);
      setState(prev => ({
        ...prev,
        recordingStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to capture photo'
      }));
    }
  }, []);

  const setRecordingMode = useCallback((mode: RecordingMode) => {
    setState(prev => ({ ...prev, recordingMode: mode }));
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setState({
      isRecording: false,
      recordingStatus: 'idle',
      recordingMode: 'video',
      recordedBlob: null,
      recordingDuration: 0,
      errorMessage: ''
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    capturePhoto,
    setRecordingMode,
    reset
  };
}