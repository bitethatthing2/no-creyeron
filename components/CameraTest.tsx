'use client';

import React, { useRef, useState } from 'react';

export default function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const testCamera = async () => {
    console.log('🔥 Starting camera test...');
    setStatus('loading');
    setError('');
    
    try {
      // Test 1: Check if getUserMedia exists
      console.log('✅ Testing getUserMedia availability...');
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      // Test 2: Try to get camera stream
      console.log('✅ Requesting camera stream...');
      const constraints = { video: true, audio: false };
      console.log('🎯 Constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got stream:', mediaStream);
      console.log('🎯 Stream tracks:', mediaStream.getTracks());
      
      setStream(mediaStream);
      
      // Test 3: Assign to video element
      if (videoRef.current) {
        console.log('✅ Assigning stream to video element...');
        videoRef.current.srcObject = mediaStream;
        console.log('✅ Stream assigned successfully');
        
        // Try to play
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
        } catch (playError) {
          console.warn('⚠️ Play failed:', playError);
          // This is often OK - browser might block autoplay
        }
      }
      
      setStatus('active');
      console.log('🎉 Camera test successful!');
      
    } catch (err) {
      console.error('❌ Camera test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track);
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    console.log('✅ Camera stopped');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-white text-xl font-bold text-center">Camera Test</h2>
        
        {/* Video Element */}
        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {status === 'active' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              {status === 'loading' && (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Loading camera...</p>
                </div>
              )}
              {status === 'idle' && <p>Camera not started</p>}
              {status === 'error' && (
                <div className="text-center text-red-400">
                  <p>Error:</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="text-white text-sm">
          <p><strong>Status:</strong> {status}</p>
          {stream && (
            <div>
              <p><strong>Tracks:</strong> {stream.getTracks().length}</p>
              {stream.getTracks().map((track, i) => (
                <p key={i} className="text-xs">
                  Track {i}: {track.kind} - {track.readyState}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={testCamera}
            disabled={status === 'loading'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded"
          >
            {status === 'active' ? 'Restart Camera' : 'Test Camera'}
          </button>
          <button
            onClick={stopCamera}
            disabled={status === 'idle' || status === 'loading'}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Stop Camera
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            // In a real app, you'd close this modal
            window.location.reload();
          }}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
        >
          Close Test
        </button>
      </div>
    </div>
  );
}