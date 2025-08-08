'use client';

import { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
// PackDollarSystem functionality integrated into TikTok-style Wolfpack Local Pack
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Export the UnifiedContentItem interface for use in other components
export interface UnifiedContentItem {
  id: string;
  type: 'social' | 'dj_live' | 'event' | 'business' | 'ai_content';
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  created_at: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  is_live?: boolean;
  user_liked?: boolean;
  user_shared?: boolean;
  user_commented?: boolean;
  event_data?: {
    title: string;
    date: string;
    location: string;
    rsvp_count: number;
    price?: number;
    category?: string;
    is_cancelled?: boolean;
    featured?: boolean;
    external_ticket_link?: string;
  };
  business_data?: {
    name: string;
    category: string;
    pack_dollars: number;
    rating: number;
    price_range: string;
    hours: string;
    phone?: string;
    website?: string;
    description: string;
    services: string[];
    popular_items: string[];
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
  ai_metadata?: {
    confidence: number;
    source: string;
    tags: string[];
  };
}

interface UnifiedContentRendererProps {
  content: UnifiedContentItem;
  currentUser: any;
  isActive: boolean;
  onLike: (contentId: string) => void;
  onComment: (contentId: string) => void;
  onShare: (contentId: string) => void;
  onReactionAdd: (contentId: string, emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
  onJoinEvent: (eventId: string) => void;
  onBusinessAction: (businessId: string) => void;
  onUserProfile: (userId: string) => void;
  className?: string;
}

export default function UnifiedContentRenderer({
  content,
  currentUser,
  isActive,
  onLike,
  onComment,
  onShare,
  onReactionAdd,
  onReactionRemove,
  onJoinEvent,
  onBusinessAction,
  onUserProfile,
  className = ''
}: UnifiedContentRendererProps) {
  const [userInteractions, setUserInteractions] = useState({
    liked: content.user_liked || false,
    shared: content.user_shared || false,
    commented: content.user_commented || false
  });
  const [showPackDollars, setShowPackDollars] = useState(false);

  // Update user interactions when content changes
  useEffect(() => {
    setUserInteractions({
      liked: content.user_liked || false,
      shared: content.user_shared || false,
      commented: content.user_commented || false
    });
  }, [content.user_liked, content.user_shared, content.user_commented]);

  // Enhanced like handler with optimistic UI and Pack Dollar rewards
  const handleLike = async () => {
    setUserInteractions(prev => ({ ...prev, liked: !prev.liked }));
    onLike(content.id);
    
    // Award Pack Dollars for liking
    if (!userInteractions.liked) {
      await awardPackDollars(1, 'engagement', 'Liked content');
    }
  };

  // Enhanced comment handler
  const handleComment = async () => {
    setUserInteractions(prev => ({ ...prev, commented: true }));
    onComment(content.id);
    
    // Award Pack Dollars for commenting
    if (!userInteractions.commented) {
      await awardPackDollars(2, 'engagement', 'Commented on content');
    }
  };

  // Enhanced share handler
  const handleShare = async () => {
    setUserInteractions(prev => ({ ...prev, shared: true }));
    onShare(content.id);
    
    // Award Pack Dollars for sharing
    if (!userInteractions.shared) {
      await awardPackDollars(3, 'social', 'Shared content');
    }
  };

  // Award Pack Dollars function
  const awardPackDollars = async (amount: number, source: string, description: string) => {
    if (!currentUser) return;

    try {
      // Record transaction
      const { error: transactionError } = await supabase
        .from('pack_dollar_transactions')
        .insert([{
          user_id: currentUser.id,
          type: 'earn',
          amount,
          source,
          description,
          metadata: { content_id: content.id, content_type: content.type }
        }]);

      if (transactionError) {
        console.error('Error recording Pack Dollar transaction:', transactionError);
        return;
      }

      // Update balance
      const { data: currentBalance } = await supabase
        .from('pack_dollar_balances')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (currentBalance) {
        const newBalance = currentBalance.balance + amount;
        const newEarnedToday = currentBalance.earned_today + amount;
        const newEarnedTotal = currentBalance.earned_total + amount;

        const { error: balanceError } = await supabase
          .from('pack_dollar_balances')
          .update({
            balance: newBalance,
            earned_today: newEarnedToday,
            earned_total: newEarnedTotal,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);

        if (!balanceError) {
          toast.success(`+${amount} Pack Dollars! ${description}`);
        }
      }
    } catch (error) {
      console.error('Error awarding Pack Dollars:', error);
    }
  };

  // Double-click handler for quick like
  const handleDoubleClick = () => {
    if (!userInteractions.liked) {
      handleLike();
    }
  };

  // Determine media type from URL or content type
  const getMediaType = (): 'image' | 'video' | 'audio' => {
    if (content.media_type) {
      return content.media_type;
    }
    
    if (content.media_url) {
      const url = content.media_url.toLowerCase();
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
        return 'video';
      }
      if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg')) {
        return 'audio';
      }
    }
    
    return 'image';
  };

  // Enhanced content processing
  const processedContent = {
    ...content,
    media_type: getMediaType(),
    user_liked: userInteractions.liked,
    display_name: content.display_name || getDefaultDisplayName(content.type),
    avatar_url: content.avatar_url || getDefaultAvatar(content.type),
    content: content.content || getDefaultContent(content.type, content)
  };

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ContentCard
        {...processedContent}
        isActive={isActive}
        user_liked={userInteractions.liked}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onUserProfile={() => onUserProfile(content.user_id)}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full"
      />
      
      {/* Pack Dollar Overlay - Integrated functionality */}
      {showPackDollars && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Pack Dollars</h3>
                <p className="text-yellow-200 text-sm">Earn through engagement!</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pack Dollar Toggle */}
      {currentUser && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowPackDollars(!showPackDollars)}
            className="w-12 h-12 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="Pack Dollars"
          >
            <span className="text-white text-lg">💰</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions for default values
function getDefaultDisplayName(type: string): string {
  switch (type) {
    case 'dj_live':
      return 'DJ Live';
    case 'event':
      return 'Event Host';
    case 'business':
      return 'Business Owner';
    case 'ai_content':
      return 'Salem AI';
    default:
      return 'Wolf Pack Member';
  }
}

function getDefaultAvatar(type: string): string {
  switch (type) {
    case 'dj_live':
      return '/icons/dj-icon.png';
    case 'event':
      return '/icons/event-icon.png';
    case 'business':
      return '/icons/business-icon.png';
    case 'ai_content':
      return '/icons/ai-icon.png';
    default:
      return '/icons/wolf-icon.png';
  }
}

function getDefaultContent(type: string, content: UnifiedContentItem): string {
  switch (type) {
    case 'dj_live':
      return 'Live DJ session happening now! Join the pack and feel the energy! 🎵🐺';
    case 'event':
      return content.event_data ? 
        `Join us for ${content.event_data.title}! Don't miss out on this amazing event.` :
        'Exciting event coming up! Mark your calendars and join the pack! 🎉';
    case 'business':
      return content.business_data ? 
        `Check out ${content.business_data.name} - ${content.business_data.description}` :
        'Discover amazing local businesses in Salem! Support your pack community! 🏪';
    case 'ai_content':
      return 'AI-curated content just for the Salem Wolf Pack! Discover what\'s happening in your community! ✨';
    default:
      return 'What\'s happening in the Wolf Pack today? Join the conversation! 💬';
  }
}

// Export the UnifiedContentItem type for use in other components
export type { UnifiedContentItem };