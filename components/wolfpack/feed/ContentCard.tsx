'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Calendar, Clock, MapPin, Users, Ticket, ExternalLink, Phone, Globe, Star, DollarSign, Zap } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OptimizedMedia from './OptimizedMedia';

interface ContentCardProps {
  id: string;
  type: 'social' | 'dj_live' | 'event' | 'business' | 'ai_content';
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  is_live?: boolean;
  isActive: boolean;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  user_liked?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserProfile: () => void;
  onDoubleClick: () => void;
  className?: string;
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
    business_idea: string;
    category: string;
    funding_needed?: number;
    target_audience: string;
    tags: string[];
    pitch_summary: string;
  };
}

export default function ContentCard({
  id,
  type,
  user_id,
  display_name,
  avatar_url,
  content,
  media_url,
  media_type = 'image',
  is_live = false,
  isActive,
  likes_count,
  wolfpack_comments_count,
  shares_count,
  user_liked = false,
  onLike,
  onComment,
  onShare,
  onUserProfile,
  onDoubleClick,
  className = '',
  event_data,
  business_data
}: ContentCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-play video when card becomes active
  useEffect(() => {
    if (isActive && media_type === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, media_type]);

  // Auto-play audio for DJ live content
  useEffect(() => {
    if (isActive && type === 'dj_live' && audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else if (!isActive && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, type]);

  const handleDoubleClick = () => {
    onDoubleClick();
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const togglePlayPause = () => {
    if (media_type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (type === 'dj_live' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'dj_live':
        return '🎵';
      case 'event':
        return '📅';
      case 'business':
        return '💡';
      case 'ai_content':
        return '✨';
      default:
        return '💬';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'dj_live':
        return 'bg-purple-600';
      case 'event':
        return 'bg-blue-600';
      case 'business':
        return 'bg-green-600';
      case 'ai_content':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div 
      className={`relative w-full h-full bg-gray-900 overflow-hidden ${className}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Background Media */}
      {media_url && (
        <div className="absolute inset-0 z-0">
          <OptimizedMedia
            url={media_url}
            type={media_type === 'video' ? 'video' : 'image'}
            alt="Content media"
            className="w-full h-full"
            priority={isActive}
            autoPlay={isActive && media_type === 'video'}
            muted={isMuted}
            loop={true}
            width={800}
            height={600}
            quality={90}
            onLoad={() => {
              if (media_type === 'video') setIsPlaying(true);
            }}
            onError={() => {
              console.error('Failed to load media:', media_url);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Audio for DJ Live */}
      {type === 'dj_live' && media_url && (
        <audio
          ref={audioRef}
          src={media_url}
          loop
          muted={isMuted}
          className="hidden"
        />
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
        {/* Top Section */}
        <div className="flex items-start justify-between">
          {/* Live Indicator */}
          {is_live && (
            <div className="flex items-center gap-2 bg-red-600 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">LIVE</span>
            </div>
          )}
          
          {/* Content Type Badge */}
          <div className={`${getTypeColor()} rounded-full px-3 py-1 flex items-center gap-2`}>
            <span className="text-white text-sm">{getTypeIcon()}</span>
            <span className="text-white text-sm font-medium capitalize">
              {type === 'business' ? 'idea' : type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Media Controls */}
        {(media_type === 'video' || type === 'dj_live') && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>
        )}

        {/* Volume Control */}
        {(media_type === 'video' || type === 'dj_live') && (
          <div className="absolute top-20 right-4 z-20">
            <button
              onClick={toggleMute}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Section */}
        <div className="pr-20">
          {/* Content Info */}
          <div className="w-full">
            {/* User Info - Enhanced Visual Hierarchy */}
            <button
              onClick={onUserProfile}
              className="flex items-center gap-3 mb-4 group"
            >
              <div className="relative">
                <Image
                  src={avatar_url || '/default-avatar.png'}
                  alt={display_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/80 group-hover:ring-blue-400 transition-all duration-300 shadow-lg"
                  unoptimized={avatar_url?.includes('dicebear.com')}
                />
                {is_live && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-lg block group-hover:text-blue-400 transition-colors drop-shadow-lg">
                  {display_name}
                </span>
                <span className="text-white/80 text-sm drop-shadow-md">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </button>

            {/* Content Text - Enhanced Typography */}
            <div className="text-white text-base mb-4 leading-relaxed font-medium drop-shadow-lg">
              {content}
            </div>

            {/* Event Data */}
            {type === 'event' && event_data && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-bold text-lg">{event_data.title}</h3>
                  <div className="flex gap-2">
                    {event_data.featured && (
                      <Badge className="bg-yellow-600 text-white text-xs">
                        ⭐ Featured
                      </Badge>
                    )}
                    {event_data.is_cancelled && (
                      <Badge className="bg-red-600 text-white text-xs">
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm text-white/80 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event_data.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(event_data.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event_data.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event_data.rsvp_count} going</span>
                  </div>
                </div>

                {event_data.price !== undefined && (
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold">
                      {event_data.price === 0 ? 'Free' : `$${event_data.price.toFixed(2)}`}
                    </span>
                  </div>
                )}

                {event_data.category && (
                  <div className="mb-3">
                    <Badge className="bg-blue-600 text-white text-xs">
                      {event_data.category}
                    </Badge>
                  </div>
                )}

                {event_data.external_ticket_link && !event_data.is_cancelled && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      asChild
                    >
                      <a href={event_data.external_ticket_link} target="_blank" rel="noopener noreferrer">
                        <Ticket className="w-4 h-4 mr-2" />
                        Get Tickets
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Business Idea - TikTok Style */}
            {type === 'business' && business_data && (
              <div className="space-y-2">
                <div className="text-white font-bold text-lg drop-shadow-lg">
                  {business_data.business_idea}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white text-xs">
                    {business_data.category}
                  </Badge>
                  <span className="text-blue-400 text-xs font-medium">{business_data.target_audience}</span>
                </div>
                <div className="text-white/90 text-sm">
                  {business_data.pitch_summary}
                </div>
                {business_data.tags && business_data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {business_data.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-blue-400 text-xs">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TikTok-style Action Buttons - Positioned on the right */}
        <div className="absolute right-4 bottom-20 z-30 flex flex-col gap-4 items-center">
            {/* Like Button */}
            <button
              onClick={onLike}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                user_liked 
                  ? 'bg-red-600 scale-110' 
                  : 'bg-black/30 backdrop-blur-sm group-hover:bg-black/50'
              }`}>
                <Heart 
                  className={`w-7 h-7 transition-all ${
                    user_liked ? 'text-white fill-white' : 'text-white'
                  }`} 
                />
              </div>
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {likes_count > 0 ? likes_count : ''}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={onComment}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/50 transition-colors shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {wolfpack_comments_count > 0 ? wolfpack_comments_count : ''}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={onShare}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-black/50 transition-colors shadow-lg">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {shares_count > 0 ? shares_count : ''}
              </span>
            </button>

            {/* Funding Badge for Business Ideas */}
            {type === 'business' && business_data && business_data.funding_needed && (
              <div className="flex items-center gap-2 bg-green-600 rounded-full px-3 py-2">
                <DollarSign className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">${business_data.funding_needed}k</span>
              </div>
            )}
        </div>
      </div>

      {/* Like Animation */}
      {showLikeAnimation && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="animate-ping">
            <Heart className="w-24 h-24 text-red-500 fill-red-500" />
          </div>
        </div>
      )}
    </div>
  );
}