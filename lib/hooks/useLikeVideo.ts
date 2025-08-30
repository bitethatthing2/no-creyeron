'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UseLikeVideoReturn {
  toggleLike: (videoId: string, currentLiked: boolean) => Promise<boolean>;
  loading: boolean;
}

export function useLikeVideo(): UseLikeVideoReturn {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const toggleLike = async (videoId: string, currentLiked: boolean): Promise<boolean> => {
    if (!currentUser?.id) {
      console.warn('User not authenticated');
      return false;
    }

    setLoading(true);
    try {
      if (currentLiked) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('content_post_likes')
          .delete()
          .eq('post_id', videoId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        return false; // Now unliked
      } else {
        // Like - add the like
        const { error } = await supabase
          .from('content_post_likes')
          .upsert({
            post_id: videoId,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        return true; // Now liked
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return currentLiked; // Return original state on error
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleLike,
    loading
  };
}