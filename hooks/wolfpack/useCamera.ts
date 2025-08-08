import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "loading" | "ready" | "error";
export type FacingMode = "user" | "environment";

interface UseCameraOptions {
  facingMode?: FacingMode;
  audio?: boolean;
}

interface UseCameraReturn {
  streamRef: React.MutableRefObject<MediaStream | null>;
  hasStream: boolean;
  cameraStatus: CameraStatus;
  errorMessage: string;
  facingMode: FacingMode;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  updateVideoElement: (videoElement: HTMLVideoElement | null) => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode: initialFacingMode = "user", audio = true } = options;

  const [hasStream, setHasStream] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacingMode);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Helper function to update video element with current stream
  const updateVideoElement = useCallback(
    (videoElement: HTMLVideoElement | null) => {
      videoElementRef.current = videoElement;
      if (videoElement && streamRef.current) {
        console.log("🎥 Updating video element with stream");
        videoElement.srcObject = streamRef.current;
      }
    },
    [],
  );

  // Helper function to get camera constraints with iOS compatibility
  const getCameraConstraints = useCallback((targetFacingMode: FacingMode) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS requires exact constraints for reliable camera switching
      return {
        video: {
          facingMode: { exact: targetFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio,
      };
    } else {
      // Android and desktop can use ideal constraints
      return {
        video: {
          facingMode: { ideal: targetFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio,
      };
    }
  }, [audio]);

  const startCamera = useCallback(async () => {
    try {
      console.log("=== STARTING CAMERA ===");
      setCameraStatus("loading");
      setErrorMessage("");

      const constraints = getCameraConstraints(facingMode);
      console.log("Camera constraints:", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("✅ Got camera stream:", stream);
      streamRef.current = stream;

      // Update video element if it exists
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
      }

      setHasStream(true);
      setCameraStatus("ready");
      console.log("✅ Camera setup complete!");
    } catch (error) {
      console.error("❌ Camera failed:", error);
      setHasStream(false);
      setCameraStatus("error");

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            setErrorMessage(
              "Camera access denied. Please enable camera permissions in your browser settings.",
            );
            break;
          case "NotFoundError":
            setErrorMessage(
              "No camera found. Please ensure your camera is connected and enabled.",
            );
            break;
          case "NotReadableError":
            setErrorMessage(
              "Camera is in use by another application. Please close other apps using the camera.",
            );
            break;
          case "OverconstrainedError":
            setErrorMessage(
              "Camera constraints could not be satisfied. Try adjusting video settings.",
            );
            break;
          case "AbortError":
            setErrorMessage("Camera operation was aborted. Please try again.");
            break;
          default:
            setErrorMessage(`Camera error: ${error.message}`);
        }
      } else {
        setErrorMessage("An unexpected error occurred while starting camera.");
      }
    }
  }, [facingMode, getCameraConstraints]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped camera track:", track.kind);
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }

    setHasStream(false);
    setCameraStatus("idle");
    setErrorMessage("");
  }, []);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    const previousFacingMode = facingMode;
    const oldStream = streamRef.current;

    console.log(`🔄 Switching camera from ${facingMode} to ${newFacingMode}`);

    try {
      setCameraStatus("loading");
      setErrorMessage("");

      // Get new stream BEFORE stopping the old one
      const constraints = getCameraConstraints(newFacingMode);
      console.log("New camera constraints:", constraints);

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Got new camera stream:", newStream);

      // Update state with new stream
      streamRef.current = newStream;
      setFacingMode(newFacingMode);

      // Update video element with new stream
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = newStream;
        console.log("🎥 Updated video element with new stream");
      }

      // Now stop the old stream
      if (oldStream) {
        oldStream.getTracks().forEach((track) => {
          track.stop();
          console.log("🛑 Stopped old camera track:", track.kind);
        });
      }

      setHasStream(true);
      setCameraStatus("ready");
      console.log("✅ Camera switch complete!");
    } catch (error) {
      console.error("❌ Camera switch failed:", error);

      // Revert to previous state
      setFacingMode(previousFacingMode);

      // If we lost the old stream, try to restart it
      if (!streamRef.current) {
        console.log("🔄 Attempting to restore previous camera...");
        try {
          const fallbackConstraints = getCameraConstraints(previousFacingMode);
          const fallbackStream = await navigator.mediaDevices.getUserMedia(
            fallbackConstraints,
          );

          streamRef.current = fallbackStream;
          if (videoElementRef.current) {
            videoElementRef.current.srcObject = fallbackStream;
          }

          setHasStream(true);
          setCameraStatus("ready");
          setErrorMessage(
            "Camera switch failed, but restored previous camera.",
          );
          console.log("✅ Restored previous camera");
        } catch (fallbackError) {
          console.error("❌ Failed to restore camera:", fallbackError);
          setHasStream(false);
          setCameraStatus("error");
          setErrorMessage(
            "Camera switch failed and could not restore camera. Please restart.",
          );
        }
      } else {
        setCameraStatus("ready");
        setErrorMessage(
          "Camera switch failed, but current camera is still working.",
        );
      }
    }
  }, [facingMode, getCameraConstraints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    streamRef,
    hasStream,
    cameraStatus,
    errorMessage,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    updateVideoElement,
  };
}
