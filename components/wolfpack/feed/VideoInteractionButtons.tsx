'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { InteractionButton } from '@/components/auth/InteractionButton';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VideoInteractionButtonsProps {
  videoId: string;
  likesCount: number;
  wolfpack_commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  onLike: (videoId: string) => Promise<void>;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onMoreOptions?: (videoId: string) => void;
  className?: string;
}

export default function VideoInteractionButtons({
  videoId,
  likesCount,
  wolfpack_commentsCount,
  sharesCount,
  isLiked = false,
  onLike,
  onComment,
  onShare,
  onMoreOptions,
  className
}: VideoInteractionButtonsProps) {
  const { user } = useAuth();
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);

  const handleLike = async () => {
    // Optimistic update
    setLocalIsLiked(!localIsLiked);
    setLocalLikesCount(prev => localIsLiked ? prev - 1 : prev + 1);
    
    try {
      await onLike(videoId);
    } catch (error) {
      // Revert optimistic update on error
      setLocalIsLiked(localIsLiked);
      setLocalLikesCount(likesCount);
      console.error('Failed to like video:', error);
    }
  };

  const handleShare = async () => {
    await onShare(videoId);
  };

  const handleComment = () => {
    onComment(videoId);
  };

  const handleMoreOptions = () => {
    if (onMoreOptions) {
      onMoreOptions(videoId);
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Like Button */}
      <InteractionButton
        onInteract={handleLike}
        requiresAuth={true}
        authMessage="Redirecting to sign in..."
        className="flex flex-col items-center group"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
          localIsLiked 
            ? "bg-red-500/20 text-red-500" 
            : "bg-white/10 text-white hover:bg-white/20"
        )}>
          <Heart 
            className={cn(
              "w-6 h-6 transition-all duration-200",
              localIsLiked && "fill-current scale-110"
            )} 
          />
        </div>
        <span className="text-white text-xs font-medium mt-1">
          {localLikesCount > 0 ? localLikesCount.toLocaleString() : ''}
        </span>
      </InteractionButton>

      {/* Comment Button */}
      <InteractionButton
        onInteract={handleComment}
        requiresAuth={true}
        authMessage="Redirecting to sign in..."
        className="flex flex-col items-center group"
      >
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-white text-xs font-medium mt-1">
          {wolfpack_commentsCount > 0 ? wolfpack_commentsCount.toLocaleString() : ''}
        </span>
      </InteractionButton>

      {/* Share Button - No auth required */}
      <InteractionButton
        onInteract={handleShare}
        requiresAuth={false}
        className="flex flex-col items-center group"
      >
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-white text-xs font-medium mt-1">
          {sharesCount > 0 ? sharesCount.toLocaleString() : ''}
        </span>
      </InteractionButton>

      {/* More Options - Show only for authenticated users or video owners */}
      {(user || onMoreOptions) && (
        <InteractionButton
          onInteract={handleMoreOptions}
          requiresAuth={false}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </div>
        </InteractionButton>
      )}
    </div>
  );
}