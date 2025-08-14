'use client';

import * as React from 'react';
import { useFixedServices } from '@/components/shared/FixedUnifiedInit';

interface FixedVideoLikeButtonProps {
  videoId: string;
  initialLiked?: boolean;
  initialCount?: number;
  className?: string;
  showCount?: boolean;
}

export default function FixedVideoLikeButton({
  videoId,
  initialLiked = false,
  initialCount = 0,
  className = '',
  showCount = true
}: FixedVideoLikeButtonProps) {
  const { likesService, ready } = useFixedServices();
  
  const [liked, setLiked] = React.useState(initialLiked);
  const [likeCount, setLikeCount] = React.useState(initialCount);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load initial like status
  const loadLikeStatus = React.useCallback(async () => {
    if (!likesService || !ready || !videoId) return;
    
    try {
      const stats = await likesService.getLikeStats(videoId);
      setLiked(stats.liked);
      setLikeCount(stats.count);
      setError(null);
    } catch (err) {
      console.error('Failed to load like status:', err);
      setError('Failed to load like status');
    }
  }, [likesService, ready, videoId]);

  // Load status when service is ready
  React.useEffect(() => {
    if (ready && likesService) {
      loadLikeStatus();
    }
  }, [ready, likesService, loadLikeStatus]);

  const handleLike = async () => {
    if (loading || !likesService || !ready) return;
    
    setLoading(true);
    setError(null);
    
    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    
    setLiked(!liked);
    setLikeCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);
    
    try {
      const result = await likesService.toggleVideoLike(videoId);
      
      // Update with server response
      setLiked(result.liked);
      
      if (result.action === 'already_liked') {
        // Handle case where video was already liked
        setLiked(true);
      }
      
      // Refresh count from server to ensure accuracy
      const stats = await likesService.getLikeStats(videoId);
      setLikeCount(stats.count);
      
    } catch (err) {
      console.error('Failed to toggle like:', err);
      
      // Revert optimistic update
      setLiked(prevLiked);
      setLikeCount(prevCount);
      
      // Show user-friendly error
      let errorMessage = 'Failed to update like';
      if (err instanceof Error) {
        if (err.message.includes('not authenticated')) {
          errorMessage = 'Please log in to like videos';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please try again';
        }
      }
      
      setError(errorMessage);
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <button 
        disabled 
        className={`like-button loading ${className}`}
        title="Loading..."
      >
        ⏳ {showCount && initialCount > 0 ? initialCount : ''}
      </button>
    );
  }

  return (
    <div className="like-button-container">
      <button 
        onClick={handleLike} 
        disabled={loading}
        className={`like-button ${liked ? 'liked' : 'not-liked'} ${loading ? 'loading' : ''} ${className}`}
        title={liked ? 'Unlike this video' : 'Like this video'}
      >
        <span className="like-icon">
          {loading ? '⏳' : liked ? '❤️' : '🤍'}
        </span>
        {showCount && (
          <span className="like-count">
            {likeCount > 0 ? likeCount : ''}
          </span>
        )}
      </button>
      
      {error && (
        <div className="like-error" style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
      
      <style jsx>{`
        .like-button-container {
          position: relative;
          display: inline-block;
        }
        
        .like-button {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.2s ease, opacity 0.2s ease;
          padding: 8px;
          border-radius: 8px;
        }
        
        .like-button:hover:not(:disabled) {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .like-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .like-button.liked .like-icon {
          animation: heartbeat 0.6s ease-in-out;
        }
        
        .like-count {
          font-size: 14px;
          font-weight: 600;
          min-width: 20px;
        }
        
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}