import * as React from "react";

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
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

// Helper function to compress video blob for iOS
const compressVideoBlob = async (blob: Blob): Promise<Blob> => {
  if (blob.size < 10 * 1024 * 1024) {
    return blob;
  }

  console.log("Compressing video for iOS, original size:", blob.size);

  try {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return blob;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.min(video.videoHeight, 720);

        const stream = canvas.captureStream(15);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/mp4",
          videoBitsPerSecond: 1000000,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: "video/mp4" });
          console.log("Compressed video size:", compressedBlob.size);
          resolve(compressedBlob);
        };

        mediaRecorder.start();

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

  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [recordingTime, setRecordingTime] = React.useState<number>(0);
  const [recordingProgress, setRecordingProgress] = React.useState<number>(0);
  const [recordingMode, setRecordingMode] = React.useState<RecordingMode>(
    "video",
  );
  const [maxDuration, setMaxDuration] = React.useState<number>(
    initialMaxDuration,
  );
  const [capturedMedia, setCapturedMedia] = React.useState<Blob | null>(null);
  const [mediaUrl, setMediaUrl] = React.useState<string>("");

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetMedia = React.useCallback((): void => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setCapturedMedia(null);
    setMediaUrl("");
    setRecordingTime(0);
    setRecordingProgress(0);
  }, [mediaUrl]);

  const stopRecording = React.useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording...");

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

  const startRecording = React.useCallback((stream: MediaStream): void => {
    if (!stream) return;

    console.log("Starting recording...");

    const options: MediaRecorderOptions = {};

    if (isIOS()) {
      console.log("iOS detected, using iOS-compatible settings");

      const iosSupportedTypes = [
        "video/mp4",
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      for (const mimeType of iosSupportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options.mimeType = mimeType;
          console.log("iOS using MIME type:", mimeType);
          break;
        }
      }

      options.videoBitsPerSecond = 2500000;
      options.audioBitsPerSecond = 128000;
    } else {
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
          console.log("Using MIME type:", mimeType);
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
        console.log("Recording stopped, processing...");

        if (chunks.length > 0) {
          let finalBlob = new Blob(chunks, {
            type: options.mimeType || "video/webm",
          });

          if (isIOS() && finalBlob.size > 5 * 1024 * 1024) {
            console.log("Compressing video for iOS...");
            try {
              finalBlob = await compressVideoBlob(finalBlob);
            } catch (error) {
              console.warn("Compression failed, using original:", error);
            }
          }

          setCapturedMedia(finalBlob);
          setMediaUrl(URL.createObjectURL(finalBlob));
          console.log("Recording processed, size:", finalBlob.size);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setIsRecording(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      mediaRecorder.start(isIOS() ? 1000 : undefined);
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          setRecordingProgress((newTime / maxDuration) * 100);

          if (newTime >= maxDuration) {
            stopRecording();
            onMaxDurationReached?.();
          }

          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  }, [maxDuration, onMaxDurationReached, stopRecording]);

  const takePhoto = React.useCallback(
    (videoElement: HTMLVideoElement): void => {
      if (!videoElement) return;

      console.log("Taking photo...");

      const canvas = document.createElement("canvas");

      if (isIOS()) {
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

        const quality = isIOS() ? 0.8 : 0.9;
        const format = "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCapturedMedia(blob);
              setMediaUrl(URL.createObjectURL(blob));
              console.log("Photo captured, size:", blob.size);
            }
          },
          format,
          quality,
        );
      }
    },
    [],
  );

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
