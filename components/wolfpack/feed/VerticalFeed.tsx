'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, Heart, MessageCircle, Share2, Users, Music, Calendar, Store, Sparkles, Activity, Camera } from 'lucide-react';
import Image from 'next/image';
import GestureHandler from './GestureHandler';
import UnifiedContentRenderer, { UnifiedContentItem } from './UnifiedContentRenderer';
import DJOverlay from '../live/DJOverlay';
import LiveDJOverlaySystem from '../live/LiveDJOverlaySystem';
import PerformanceMonitor from '../../system/PerformanceMonitor';
import { createOptimizedSubscription, unsubscribe, debounce } from '@/lib/services/performance-optimizer.service';

interface ContentItem {
  id: string;
  type: 'social' | 'dj_live' | 'event' | 'business' | 'ai_content';
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  is_live?: boolean;
  event_data?: {
    title: string;
    date: string;
    location: string;
    rsvp_count: number;
  };
  business_data?: {
    name: string;
    category: string;
    pack_dollars: number;
    rating: number;
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

interface VerticalFeedProps {
  content: UnifiedContentItem[];
  currentUser: any;
  onLike: (contentId: string) => void;
  onComment: (contentId: string) => void;
  onShare: (contentId: string) => void;
  onReactionAdd: (contentId: string, emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
  onJoinEvent: (eventId: string) => void;
  onBusinessAction: (businessId: string) => void;
  onUserProfile: (userId: string) => void;
  isConnected: boolean;
}

type FeedMode = 'all' | 'social' | 'live' | 'events' | 'businesses';

export default function VerticalFeed({
  content,
  currentUser,
  onLike,
  onComment,
  onShare,
  onReactionAdd,
  onReactionRemove,
  onJoinEvent,
  onBusinessAction,
  onUserProfile,
  isConnected
}: VerticalFeedProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showDJOverlay, setShowDJOverlay] = useState(true);
  const [isDJOverlayExpanded, setIsDJOverlayExpanded] = useState(false);
  const [showLiveDJOverlay, setShowLiveDJOverlay] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter content based on feed mode
  const filteredContent = content.filter(item => {
    switch (feedMode) {
      case 'social':
        return item.type === 'social';
      case 'live':
        return item.type === 'dj_live' || item.is_live;
      case 'events':
        return item.type === 'event';
      case 'businesses':
        return item.type === 'business';
      default:
        return true;
    }
  });

  // Optimized scroll to item with debouncing
  const scrollToItem = useCallback(
    debounce('scrollToItem', (index: number) => {
      if (itemRefs.current[index] && feedContainerRef.current) {
        const item = itemRefs.current[index];
        
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        setCurrentIndex(index);
      }
    }, 100), 
    []
  );

  // Gesture handlers
  const handleSwipeUp = useCallback(() => {
    const nextIndex = Math.min(filteredContent.length - 1, currentIndex + 1);
    scrollToItem(nextIndex);
  }, [currentIndex, filteredContent.length, scrollToItem]);

  const handleSwipeDown = useCallback(() => {
    const prevIndex = Math.max(0, currentIndex - 1);
    scrollToItem(prevIndex);
  }, [currentIndex, scrollToItem]);

  const handleSwipeLeft = useCallback(() => {
    // Cycle through feed modes
    const modes: FeedMode[] = ['all', 'social', 'live', 'events', 'businesses'];
    const currentModeIndex = modes.indexOf(feedMode);
    const nextModeIndex = (currentModeIndex + 1) % modes.length;
    setFeedMode(modes[nextModeIndex]);
  }, [feedMode]);

  const handleSwipeRight = useCallback(() => {
    // Cycle through feed modes (backwards)
    const modes: FeedMode[] = ['all', 'social', 'live', 'events', 'businesses'];
    const currentModeIndex = modes.indexOf(feedMode);
    const prevModeIndex = (currentModeIndex - 1 + modes.length) % modes.length;
    setFeedMode(modes[prevModeIndex]);
  }, [feedMode]);

  const handleDoubleTap = useCallback(() => {
    // Like current item
    if (filteredContent[currentIndex]) {
      onLike(filteredContent[currentIndex].id);
    }
  }, [currentIndex, filteredContent, onLike]);

  const handleLongPress = useCallback(() => {
    // Check if current item is DJ live content
    if (filteredContent[currentIndex] && filteredContent[currentIndex].type === 'dj_live') {
      setShowLiveDJOverlay(true);
    } else {
      // Toggle reactions for current item
      const currentItemId = filteredContent[currentIndex].id;
      setShowReactions(showReactions === currentItemId ? null : currentItemId);
    }
  }, [currentIndex, filteredContent, showReactions]);

  // Simple scroll tracking without auto-snap
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredContent.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [currentIndex, filteredContent.length]);


  return (
    <GestureHandler
      onSwipeUp={handleSwipeUp}
      onSwipeDown={handleSwipeDown}
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      onDoubleTap={handleDoubleTap}
      onLongPress={handleLongPress}
      className="h-screen w-full bg-gray-900 relative overflow-hidden"
    >
      
      {/* TikTok-style Top Bar - Enhanced */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-12 bg-gradient-to-b from-black/60 via-black/20 to-transparent">
        <div className="flex space-x-6">
          <button className="text-white text-sm font-medium opacity-60 hover:opacity-90 transition-opacity">
            Following
          </button>
          <button className="text-white text-sm font-bold border-b-2 border-white pb-1">
            For You
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Removed money bags and business icons */}
        </div>
      </div>
      
      {/* Main Feed */}
      <div 
        ref={feedContainerRef}
        className="h-full overflow-y-scroll"
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {filteredContent.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className="h-screen w-full"
          >
            <UnifiedContentRenderer
              content={item}
              currentUser={currentUser}
              isActive={index === currentIndex}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onReactionAdd={onReactionAdd}
              onReactionRemove={onReactionRemove}
              onJoinEvent={onJoinEvent}
              onBusinessAction={onBusinessAction}
              onUserProfile={onUserProfile}
              className="h-full w-full"
            />
          </div>
        ))}
      </div>
      
      {/* Interaction handled by ContentCard - removed duplicate */}
      
      {/* TikTok-style Bottom Navigation - Streamlined */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-around py-3 px-4">
          <button className="flex flex-col items-center py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 mb-1 text-white">🏠</div>
            <span className="text-white text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 mb-1 text-white">🔍</div>
            <span className="text-white text-xs opacity-60">Discover</span>
          </button>
          <button className="relative bg-white rounded-xl px-6 py-3 mx-2 hover:bg-gray-100 transition-colors shadow-lg">
            <div className="w-6 h-6 text-black font-bold text-center leading-6 text-xl">+</div>
          </button>
          <button className="flex flex-col items-center py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 mb-1 text-white">💬</div>
            <span className="text-white text-xs opacity-60">Inbox</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 mb-1 bg-gray-500 rounded-full"></div>
            <span className="text-white text-xs opacity-60">Profile</span>
          </button>
        </div>
      </div>

      {/* DJ Live Overlay */}
      {showDJOverlay && (
        <DJOverlay
          onClose={() => setShowDJOverlay(false)}
          isExpanded={isDJOverlayExpanded}
          onToggleExpanded={() => setIsDJOverlayExpanded(!isDJOverlayExpanded)}
        />
      )}

      {/* Advanced Live DJ Overlay System */}
      <LiveDJOverlaySystem
        isVisible={showLiveDJOverlay}
        onClose={() => setShowLiveDJOverlay(false)}
        currentUser={currentUser}
      />

      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
      />
    </GestureHandler>
  );
}