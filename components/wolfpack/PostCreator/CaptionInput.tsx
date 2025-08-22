'use client';

import * as React from 'react';
import Image from 'next/image';
import { Type, Send, RotateCcw, Hash, MapPin, Music, Users, Lock, Globe, Eye } from 'lucide-react';
import { RecordingMode } from '@/lib/hooks/wolfpack/useRecording';

interface CaptionInputProps {
  caption: string;
  mediaUrl: string;
  recordingMode: RecordingMode;
  posting: boolean;
  onCaptionChange: (caption: string) => void;
  onRetake: () => void;
  onPost: () => void;
  // Optional enhanced features
  hashtags?: string[];
  location?: string;
  musicTrack?: string;
  visibility?: 'public' | 'wolfpack' | 'private';
  onHashtagsChange?: (hashtags: string[]) => void;
  onLocationChange?: (location: string) => void;
  onMusicChange?: (track: string) => void;
  onVisibilityChange?: (visibility: 'public' | 'wolfpack' | 'private') => void;
}

function CaptionInputComponent({
  caption,
  mediaUrl,
  recordingMode,
  posting,
  onCaptionChange,
  onRetake,
  onPost,
  hashtags = [],
  location,
  musicTrack,
  visibility = 'public',
  onHashtagsChange,
  onLocationChange,
  onMusicChange,
  onVisibilityChange
}: CaptionInputProps) {
  const [showHashtagInput, setShowHashtagInput] = React.useState(false);
  const [hashtagInput, setHashtagInput] = React.useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleAddHashtag = React.useCallback(() => {
    if (hashtagInput.trim() && onHashtagsChange) {
      const cleanTag = hashtagInput.trim().replace(/^#/, '');
      if (!hashtags.includes(cleanTag)) {
        onHashtagsChange([...hashtags, cleanTag]);
      }
      setHashtagInput('');
      setShowHashtagInput(false);
    }
  }, [hashtagInput, hashtags, onHashtagsChange]);

  const handleRemoveHashtag = React.useCallback((tag: string) => {
    if (onHashtagsChange) {
      onHashtagsChange(hashtags.filter(t => t !== tag));
    }
  }, [hashtags, onHashtagsChange]);

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, color: 'text-green-400' },
    { value: 'wolfpack', label: 'Wolfpack', icon: Users, color: 'text-purple-400' },
    { value: 'private', label: 'Private', icon: Lock, color: 'text-yellow-400' }
  ];

  const currentVisibility = visibilityOptions.find(opt => opt.value === visibility);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Header with Preview */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          {/* Media Preview */}
          <div className="relative w-20 h-20 flex-shrink-0">
            {recordingMode === 'photo' ? (
              <Image
                src={mediaUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
                fill
                sizes="80px"
                priority
              />
            ) : (
              <video 
                ref={videoRef}
                src={mediaUrl} 
                className="w-full h-full object-cover rounded-xl"
                muted
                loop
                playsInline
                onMouseEnter={() => videoRef.current?.play()}
                onMouseLeave={() => videoRef.current?.pause()}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl" />
            <div className="absolute bottom-1 right-1 text-white/80 text-xs bg-black/50 px-1.5 py-0.5 rounded">
              {recordingMode === 'photo' ? '📷' : '🎥'}
            </div>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">Create Post</h3>
            <p className="text-white/60 text-sm">
              Share your {recordingMode} with the pack
            </p>
          </div>

          {/* Preview Button */}
          <button className="text-white/60 hover:text-white transition-colors" title="Preview">
            <Eye className="w-5 h-5" />
            <span className="sr-only">Preview</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Caption Input */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <Type className="w-5 h-5 text-purple-400 mt-3 flex-shrink-0" />
            <div className="flex-1">
              <textarea
                value={caption}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder="What's happening in the Wolf Pack?"
                className="w-full bg-transparent text-white placeholder-white/40 resize-none border-none outline-none text-sm leading-relaxed"
                rows={3}
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-white/40 text-xs">
                  {caption.length}/300 characters
                </div>
                {caption.length > 250 && (
                  <div className="text-yellow-400 text-xs">
                    Nearly at limit
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hashtags */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium">Hashtags</span>
            </div>
            <button
              onClick={() => setShowHashtagInput(!showHashtagInput)}
              className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
            >
              + Add
            </button>
          </div>
          
          {showHashtagInput && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag()}
                placeholder="Enter hashtag"
                className="flex-1 bg-black/30 text-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400/50"
                maxLength={30}
              />
              <button
                onClick={handleAddHashtag}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          )}
          
          {hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveHashtag(tag)}
                    className="hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-xs">No hashtags added</p>
          )}
        </div>

        {/* Location */}
        {onLocationChange && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
              <input
                type="text"
                value={location || ''}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Add location"
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Music */}
        {onMusicChange && recordingMode === 'video' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-green-400 flex-shrink-0" />
              <input
                type="text"
                value={musicTrack || ''}
                onChange={(e) => onMusicChange && onMusicChange(e.target.value)}
                placeholder="Add music track"
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Visibility */}
        {onVisibilityChange && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">Visibility</span>
              {currentVisibility && (
                <div className={`flex items-center gap-1 ${currentVisibility.color}`}>
                  {currentVisibility.icon && <currentVisibility.icon className="w-4 h-4" />}
                  <span className="text-xs">{currentVisibility.label}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onVisibilityChange(option.value as 'public' | 'wolfpack' | 'private')}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all
                    ${visibility === option.value
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  <option.icon className="w-4 h-4 mx-auto mb-1" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <button
            onClick={onRetake}
            disabled={posting}
            className="flex-1 bg-white/10 text-white py-3.5 rounded-xl font-semibold transition-all hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retake
          </button>
          <button
            onClick={onPost}
            disabled={posting || !caption.trim()}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {posting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Post to Feed</span>
              </>
            )}
          </button>
        </div>
        
        {!caption.trim() && (
          <p className="text-center text-yellow-400/60 text-xs mt-2">
            Add a caption to post
          </p>
        )}
      </div>
    </div>
  );
}

export const CaptionInput = React.memo(CaptionInputComponent);