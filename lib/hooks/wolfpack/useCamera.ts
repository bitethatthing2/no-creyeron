import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "loading" | "ready" | "error";
export type FacingMode = "user" | "environment";

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface UseCameraOptions {
  initialFacingMode?: FacingMode;
  videoConstraints?: MediaTrackConstraints;
  audioConstraints?: MediaTrackConstraints | boolean;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  hasStream: boolean;
  cameraStatus: CameraStatus;
  errorMessage: string;
  facingMode: FacingMode;
  availableCameras: CameraDevice[];
  currentCameraId: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  switchToCamera: (deviceId: string) => Promise<void>;
  takePhoto: () => string | null;
  startRecording: () => void;
  stopRecording: () => Blob | null;
  isRecording: boolean;
  recordingDuration: number;
  hasMultipleCameras: boolean;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    initialFacingMode = "user",
    videoConstraints = {},
    audioConstraints = false,
  } = options;

  // State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacingMode);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const hasStream = Boolean(stream);
  const hasMultipleCameras = availableCameras.length > 1;

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
          kind: device.kind,
        }));
      setAvailableCameras(cameras);
      return cameras;
    } catch (error) {
      console.error("Error enumerating devices:", error);
      return [];
    }
  }, []);

  // Start camera with specific constraints
  const startCameraWithConstraints = useCallback(async (
    constraints: MediaStreamConstraints,
  ): Promise<MediaStream> => {
    try {
      setCameraStatus("loading");
      setErrorMessage("");

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Get new stream
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set video element source
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      // Get the actual device ID being used
      const videoTrack = newStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.deviceId) {
        setCurrentCameraId(settings.deviceId);
      }

      setStream(newStream);
      setCameraStatus("ready");

      return newStream;
    } catch (error) {
      const err = error as DOMException;
      let message = "Failed to access camera";

      if (err.name === "NotAllowedError") {
        message = "Camera permission denied. Please allow camera access.";
      } else if (err.name === "NotFoundError") {
        message = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        message = "Camera is being used by another application.";
      } else if (err.name === "OverconstrainedError") {
        message = "Camera doesn't support the requested settings.";
      }

      setErrorMessage(message);
      setCameraStatus("error");
      throw error;
    }
  }, [stream]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // First enumerate devices to check what's available
      await getAvailableCameras();

      // Build constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          ...videoConstraints,
        },
        audio: audioConstraints,
      };

      // Try with facing mode first
      try {
        await startCameraWithConstraints(constraints);
      } catch (error) {
        // If facing mode fails, try without it
        console.warn("Failed with facingMode, trying without:", error);
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            ...videoConstraints,
          },
          audio: audioConstraints,
        };
        await startCameraWithConstraints(fallbackConstraints);
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
    }
  }, [
    facingMode,
    videoConstraints,
    audioConstraints,
    getAvailableCameras,
    startCameraWithConstraints,
  ]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setCameraStatus("idle");
    setCurrentCameraId(null);
    setIsRecording(false);
    setRecordingDuration(0);
  }, [stream, isRecording]);

  // Switch to specific camera by device ID
  const switchToCamera = useCallback(async (deviceId: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          ...videoConstraints,
        },
        audio: audioConstraints,
      };

      await startCameraWithConstraints(constraints);

      // Update facing mode based on camera label if possible
      const camera = availableCameras.find((cam) => cam.deviceId === deviceId);
      if (camera) {
        if (
          camera.label.toLowerCase().includes("back") ||
          camera.label.toLowerCase().includes("rear")
        ) {
          setFacingMode("environment");
        } else if (camera.label.toLowerCase().includes("front")) {
          setFacingMode("user");
        }
      }
    } catch (error) {
      console.error("Failed to switch to camera:", error);
    }
  }, [
    videoConstraints,
    audioConstraints,
    availableCameras,
    startCameraWithConstraints,
  ]);

  // Switch camera (toggle between front/back)
  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) {
      console.warn("Only one camera available");
      return;
    }

    const newFacingMode: FacingMode = facingMode === "user"
      ? "environment"
      : "user";
    setFacingMode(newFacingMode);

    if (stream) {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { exact: newFacingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            ...videoConstraints,
          },
          audio: audioConstraints,
        };

        await startCameraWithConstraints(constraints);
      } catch (error) {
        // If exact facing mode fails, try without exact
        console.warn("Failed with exact facingMode, trying ideal:", error);
        try {
          const fallbackConstraints: MediaStreamConstraints = {
            video: {
              facingMode: newFacingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              ...videoConstraints,
            },
            audio: audioConstraints,
          };
          await startCameraWithConstraints(fallbackConstraints);
        } catch (fallbackError) {
          // If that still fails, just get the next available camera
          console.warn(
            "Failed with ideal facingMode, switching to next camera:",
            fallbackError,
          );
          const currentIndex = availableCameras.findIndex((cam) =>
            cam.deviceId === currentCameraId
          );
          const nextIndex = (currentIndex + 1) % availableCameras.length;
          const nextCamera = availableCameras[nextIndex];

          if (nextCamera) {
            await switchToCamera(nextCamera.deviceId);
          }
        }
      }
    }
  }, [
    hasMultipleCameras,
    facingMode,
    stream,
    videoConstraints,
    audioConstraints,
    availableCameras,
    currentCameraId,
    startCameraWithConstraints,
    switchToCamera,
  ]);

  // Take photo
  const takePhoto = useCallback((): string | null => {
    if (!videoRef.current || !hasStream) return null;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    // Flip horizontally if front camera
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [hasStream, facingMode]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;

    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.start(100); // Collect data every 100ms
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingDuration(0);

    // Start duration counter
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  }, [stream, isRecording]);

  // Stop recording
  const stopRecording = useCallback((): Blob | null => {
    if (!mediaRecorderRef.current || !isRecording) return null;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingDuration(0);

    if (recordedChunksRef.current.length === 0) return null;

    const mimeType = recordedChunksRef.current[0].type || "video/webm";
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    recordedChunksRef.current = [];

    return blob;
  }, [isRecording]);

  // Initialize camera list on mount
  useEffect(() => {
    getAvailableCameras();

    // Listen for device changes
    const handleDeviceChange = () => {
      getAvailableCameras();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
  }, [getAvailableCameras]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    hasStream,
    cameraStatus,
    errorMessage,
    facingMode,
    availableCameras,
    currentCameraId,
    startCamera,
    stopCamera,
    switchCamera,
    switchToCamera,
    takePhoto,
    startRecording,
    stopRecording,
    isRecording,
    recordingDuration,
    hasMultipleCameras,
  };
}
