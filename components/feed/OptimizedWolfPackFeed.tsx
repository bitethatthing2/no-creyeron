/**
 * Optimized Wolf Pack Feed Example
 * Complete implementation showing how to use the high-performance feed components
 */

'use client';

import React, { useState } from 'react';
import { VirtualizedFeed } from './VirtualizedFeed';
import { OptimizedVideoItem } from '@/lib/hooks/useOptimizedFeed';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface OptimizedWolfPackFeedProps {
  className?: string;
  showDebugInfo?: boolean;
}

export function OptimizedWolfPackFeed({ 
  className = '',
  showDebugInfo = false 
}: OptimizedWolfPackFeedProps) {
  
  const [selectedVideo, setSelectedVideo] = useState<OptimizedVideoItem | null>(null);

  const handlewolfpack_videoselect = (video: OptimizedVideoItem) => {
    setSelectedVideo(video);
    // TODO: Open video modal or navigate to video detail page
    console.log('Selected video:', video);
  };

  const handlewolfpack_videoshare = (videoId: string) => {
    // TODO: Implement sharing functionality
    console.log('Share video:', videoId);
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen bg-black ${className}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🐺</div>
              <h1 className="text-xl font-bold text-white">Wolf Pack Feed</h1>
            </div>
            
            {showDebugInfo && (
              <div className="text-xs text-gray-400">
                Optimized • Virtual Scrolling • Cached
              </div>
            )}
          </div>
        </div>

        {/* Feed Container */}
        <div className="relative">
          <VirtualizedFeed
            onwolfpack_videoselect={handlewolfpack_videoselect}
            onShare={handlewolfpack_videoshare}
            showDebugInfo={showDebugInfo}
            className="h-[calc(100vh-80px)]" // Account for header height
          />
        </div>

        {/* Video Detail Modal */}
        {selectedVideo && (
          <VideoDetailModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// Video Detail Modal Component
function VideoDetailModal({ 
  video, 
  onClose 
}: { 
  video: OptimizedVideoItem; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Video Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {video.title || 'Untitled Video'}
              </h3>
              <p className="text-gray-300">{video.description || video.caption}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{video.likes_count} likes</span>
              <span>{video.wolfpack_comments_count} wolfpack_comments</span>
              <span>{video.view_count} views</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                {video.user?.wolf_emoji || '🐺'}
              </div>
              <div>
                <p className="text-white font-medium">{video.username}</p>
                <p className="text-gray-400 text-sm">Wolf Pack Member</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage example for different contexts
export function WolfPackFeedPage() {
  return (
    <OptimizedWolfPackFeed 
      showDebugInfo={process.env.NODE_ENV === 'development'}
    />
  );
}

// Usage in a dashboard or sidebar
export function WolfPackFeedWidget({ height = '400px' }: { height?: string }) {
  return (
    <div style={{ height }} className="border border-gray-800 rounded-lg overflow-hidden">
      <VirtualizedFeed 
        className="h-full"
        itemHeight={300} // Smaller items for widget view
      />
    </div>
  );
}