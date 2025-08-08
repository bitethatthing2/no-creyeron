import { useCallback, useRef, useState } from "react";

export type RecordingMode = "photo" | "video";

interface UseRecordingOptions {
  maxDuration?: number;
  onMaxDurationReached?: () => void;
}

interface UseRecordingReturn {
  isRecording: boolean;
  recordingTime: number;
  recordingProgress: number;
  recordingMode: RecordingMode;
  maxDuration: number;
  capturedMedia: Blob | null;
  mediaUrl: string;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => void;
  takePhoto: (videoElement: HTMLVideoElement) => void;
  setRecordingMode: (mode: RecordingMode) => void;
  setMaxDuration: (duration: number) => void;
  resetMedia: () => void;
}

// Helper function to detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

// Helper function to compress video blob for iOS
const compressVideoBlob = async (blob: Blob): Promise<Blob> => {
  // For iOS, we'll try to reduce file size by re-encoding if possible
  // This is a simplified approach - in production you might want to use a library like ffmpeg.wasm

  if (blob.size < 10 * 1024 * 1024) { // Less than 10MB, no compression needed
    return blob;
  }

  console.log("🗜️ Compressing video for iOS, original size:", blob.size);

  try {
    // Create a video element to re-encode the video
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return blob;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = Math.min(video.videoWidth, 1280); // Max width for iOS
        canvas.height = Math.min(video.videoHeight, 720); // Max height for iOS

        const stream = canvas.captureStream(15); // 15 FPS for iOS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/mp4", // iOS prefers mp4
          videoBitsPerSecond: 1000000, // 1 Mbps for iOS
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: "video/mp4" });
          console.log("✅ Compressed video size:", compressedBlob.size);
          resolve(compressedBlob);
        };

        mediaRecorder.start();

        // Draw frames to canvas for re-encoding
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
          }
        };

        video.play();
        drawFrame();
      };

      video.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.warn("Video compression failed, using original:", error);
    return blob;
  }
};

export function useRecording(
  options: UseRecordingOptions = {},
): UseRecordingReturn {
  const { maxDuration: initialMaxDuration = 60, onMaxDurationReached } =
    options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("video");
  const [maxDuration, setMaxDuration] = useState(initialMaxDuration);
  const [capturedMedia, setCapturedMedia] = useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetMedia = useCallback(() => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setCapturedMedia(null);
    setMediaUrl("");
    setRecordingTime(0);
    setRecordingProgress(0);
  }, [mediaUrl]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (!stream) return;

    console.log("🎬 Starting recording...");

    // iOS-specific MIME type selection
    const options: MediaRecorderOptions = {};

    if (isIOS()) {
      console.log("📱 iOS detected, using iOS-compatible settings");

      // iOS Safari supports these formats (in order of preference)
      const iosSupportedTypes = [
        "video/mp4",
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/webm;codecs=vp8,opus", // Limited support
        "video/webm",
      ];

      for (const mimeType of iosSupportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType;
          console.log("🎥 iOS using MIME type:", mimeType);
          break;
        }
      }

      // iOS-specific settings for better performance
      options.videoBitsPerSecond = 2500000; // 2.5 Mbps for iOS
      options.audioBitsPerSecond = 128000; // 128 kbps for iOS
    } else {
      // Non-iOS devices can use more formats
      const supportedTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
      ];

      for (const mimeType of supportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType;
          console.log("🎥 Using MIME type:", mimeType);
          break;
        }
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 Recording stopped, processing...");

        if (chunks.length > 0) {
          let finalBlob = new Blob(chunks, {
            type: options.mimeType || "video/webm",
          });

          // Compress video for iOS if needed
          if (isIOS() && finalBlob.size > 5 * 1024 * 1024) { // 5MB threshold for iOS
            console.log("🗜️ Compressing video for iOS...");
            try {
              finalBlob = await compressVideoBlob(finalBlob);
            } catch (error) {
              console.warn("Compression failed, using original:", error);
            }
          }

          setCapturedMedia(finalBlob);
          setMediaUrl(URL.createObjectURL(finalBlob));
          console.log("✅ Recording processed, size:", finalBlob.size);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        setIsRecording(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      mediaRecorder.start(isIOS() ? 1000 : undefined); // iOS benefits from timeslice
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          setRecordingProgress((newTime / maxDuration) * 100);

          // Auto-stop when max duration reached
          if (newTime >= maxDuration) {
            stopRecording();
            onMaxDurationReached?.();
          }

          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      setIsRecording(false);
    }
  }, [maxDuration, onMaxDurationReached]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("🛑 Stopping recording...");

      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping recording:", error);
      }

      setIsRecording(false);
      setRecordingProgress(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const takePhoto = useCallback((videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    console.log("📸 Taking photo...");

    const canvas = document.createElement("canvas");

    // iOS-specific photo settings
    if (isIOS()) {
      // Limit resolution for iOS to prevent memory issues
      const maxWidth = 1920;
      const maxHeight = 1080;

      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

      if (videoElement.videoWidth > maxWidth) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
      } else if (videoElement.videoHeight > maxHeight) {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
      } else {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      }
    } else {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // iOS prefers JPEG with lower quality for smaller file sizes
      const quality = isIOS() ? 0.8 : 0.9;
      const format = "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedMedia(blob);
            setMediaUrl(URL.createObjectURL(blob));
            console.log("✅ Photo captured, size:", blob.size);
          }
        },
        format,
        quality,
      );
    }
  }, []);

  return {
    isRecording,
    recordingTime,
    recordingProgress,
    recordingMode,
    maxDuration,
    capturedMedia,
    mediaUrl,
    startRecording,
    stopRecording,
    takePhoto,
    setRecordingMode,
    setMaxDuration,
    resetMedia,
  };
}
