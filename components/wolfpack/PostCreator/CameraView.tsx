import { forwardRef, memo } from 'react';
import { Camera } from 'lucide-react';
import { CameraStatus, FacingMode } from '@/hooks/wolfpack/useCamera';

interface CameraViewProps {
  hasStream: boolean;
  cameraStatus: CameraStatus;
  errorMessage: string;
  facingMode: FacingMode;
  onStartCamera: () => void;
}

const CameraViewComponent = forwardRef<HTMLVideoElement, CameraViewProps>(
  ({ hasStream, cameraStatus, errorMessage, facingMode, onStartCamera }, ref) => {
    if (hasStream) {
      return (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)' }}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-white bg-gray-900">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          
          {cameraStatus === 'loading' && (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
              <p>Starting camera...</p>
            </>
          )}
          
          {cameraStatus === 'error' && (
            <>
              <p className="text-red-400 font-medium">Camera Error</p>
              <p className="text-sm text-gray-300">{errorMessage}</p>
            </>
          )}
          
          {cameraStatus === 'idle' && (
            <p>Camera not ready</p>
          )}
          
          <button 
            onClick={onStartCamera}
            disabled={cameraStatus === 'loading'}
            className="bg-pink-500 px-6 py-3 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {cameraStatus === 'loading' ? 'Starting...' : 'Start Camera'}
          </button>
        </div>
      </div>
    );
  }
);

CameraViewComponent.displayName = 'CameraView';

export const CameraView = memo(CameraViewComponent);