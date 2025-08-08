import { Type, Send } from 'lucide-react';
import { memo } from 'react';
import { RecordingMode } from '@/hooks/wolfpack/useRecording';

interface CaptionInputProps {
  caption: string;
  mediaUrl: string;
  recordingMode: RecordingMode;
  posting: boolean;
  onCaptionChange: (caption: string) => void;
  onRetake: () => void;
  onPost: () => void;
}

function CaptionInputComponent({
  caption,
  mediaUrl,
  recordingMode,
  posting,
  onCaptionChange,
  onRetake,
  onPost
}: CaptionInputProps) {
  return (
    <div className="px-4 space-y-4">
      {/* Preview thumbnail */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/20">
          {recordingMode === 'photo' ? (
            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <video src={mediaUrl} className="w-full h-full object-cover" muted />
          )}
        </div>
      </div>

      {/* Caption input */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Type className="w-5 h-5 text-white mt-3" />
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="What's happening in the Wolf Pack?"
            className="flex-1 bg-transparent text-white placeholder-white/70 resize-none border-none outline-none text-sm"
            rows={3}
            maxLength={300}
          />
        </div>
        <div className="text-right text-white/50 text-xs mt-2">
          {caption.length}/300
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRetake}
          disabled={posting}
          className="flex-1 bg-black/30 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          Retake
        </button>
        <button
          onClick={onPost}
          disabled={posting}
          className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {posting ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Post
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export const CaptionInput = memo(CaptionInputComponent);