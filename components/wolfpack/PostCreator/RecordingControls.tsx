import { Camera } from 'lucide-react';
import { memo } from 'react';
import { RecordingMode } from '@/hooks/wolfpack/useRecording';

interface RecordingControlsProps {
  recordingMode: RecordingMode;
  isRecording: boolean;
  hasStream: boolean;
  onModeChange: (mode: RecordingMode) => void;
  onMainAction: () => void;
}

function RecordingControlsComponent({
  recordingMode,
  isRecording,
  hasStream,
  onModeChange,
  onMainAction
}: RecordingControlsProps) {
  return (
    <>
      {/* Mode selector */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-black/30 rounded-full p-1">
          <button
            onClick={() => onModeChange('photo')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              recordingMode === 'photo' 
                ? 'bg-white text-black' 
                : 'text-white'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => onModeChange('video')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              recordingMode === 'video' 
                ? 'bg-white text-black' 
                : 'text-white'
            }`}
          >
            Video
          </button>
        </div>
      </div>

      {/* Main record button */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer ring for recording state */}
          <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 ${
            isRecording 
              ? 'border-red-500 scale-110' 
              : 'border-white/50'
          }`}>
            {/* Inner button */}
            <button
              onClick={onMainAction}
              disabled={!hasStream}
              className={`w-full h-full rounded-full transition-all duration-200 ${
                recordingMode === 'photo'
                  ? 'bg-white disabled:bg-gray-400'
                  : isRecording
                    ? 'bg-red-500 scale-75'
                    : 'bg-pink-500 disabled:bg-gray-400'
              } disabled:opacity-50 flex items-center justify-center`}
            >
              {recordingMode === 'photo' ? (
                <Camera className="w-8 h-8 text-black" />
              ) : isRecording ? (
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              ) : (
                <div className="w-6 h-6 bg-white rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const RecordingControls = memo(RecordingControlsComponent);