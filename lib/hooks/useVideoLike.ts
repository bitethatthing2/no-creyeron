// React Hook for Video Likes
"use client";

import * as React from 'react';
import { supabase } from "@/lib/supabase";
import { LikeService } from "@/lib/services/like.service";

export const useVideoLike = (
  videoId: string,
  initialLiked = false,
  initialCount = 0,
) => {
  const [liked, setLiked] = React.useState(initialLiked);
  const [likeCount, setLikeCount] = React.useState(initialCount);
  const [loading, setLoading] = React.useState(false);
  // Using singleton instance
  // const supabase is already imported;
  const likeService = new LikeService(supabase);

  // Load initial like status
  React.useEffect(() => {
    if (videoId) {
      loadLikeStatus();
    }
  }, [videoId]);

  const loadLikeStatus = async () => {
    try {
      const status = await likeService.getLikeStatus(videoId);
      setLiked(status.liked);
      setLikeCount(status.count);
    } catch (error) {
      console.error("Failed to load like status:", error);
    }
  };

  const toggleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await likeService.toggleLike(videoId);
      
      // Handle different response types
      if (result.action === 'already_liked') {
        // Video was already liked, just update UI
        setLiked(true);
        console.log('Video was already liked');
        return;
      }
      
      // Update UI based on result
      setLiked(result.liked);
      setLikeCount((prev) => {
        if (result.action === 'liked') {
          return prev + 1;
        } else if (result.action === 'unliked') {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
      
      console.log(`Successfully ${result.action} video`);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      
      // Show user-friendly error messages
      let errorMessage = "Failed to update like. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = "Please log in to like videos.";
        } else if (error.message.includes('temporarily unavailable')) {
          errorMessage = "Like feature is temporarily unavailable.";
        } else if (error.message.includes('Video not found')) {
          errorMessage = "This video is no longer available.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      // You can replace alert with a toast notification if available
      if (typeof window !== 'undefined') {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return { liked, likeCount, toggleLike, loading, refresh: loadLikeStatus };
};
