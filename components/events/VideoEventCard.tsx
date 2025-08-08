'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  Ticket, 
  ExternalLink, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  MapPin,
  Users,
  Heart,
  Share2,
  Trophy,
  Vote,
  Target,
  Zap
} from 'lucide-react';
import type { Event } from '@/types/features/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VideoEventCardProps {
  event: Event;
  isActive?: boolean;
  onLike?: () => void;
  onShare?: () => void;
  onRSVP?: () => void;
  onVote?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  rsvpCount?: number;
  isRSVPed?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
  previewImage?: string;
  className?: string;
}

export default function VideoEventCard({
  event,
  isActive = false,
  onLike,
  onShare,
  onRSVP,
  onVote,
  isLiked = false,
  likeCount = 0,
  rsvpCount = 0,
  isRSVPed = false,
  hasVideo = false,
  videoUrl,
  previewImage,
  className = ''
}: VideoEventCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when card becomes active
  useEffect(() => {
    if (isActive && hasVideo && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, hasVideo]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Determine if event is in the past
  const isPastEvent = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.date);
    return eventDate < today;
  };

  // Handle price display if available
  const formatPrice = (price?: number) => {
    if (!price) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDoubleClick = () => {
    if (onLike) {
      onLike();
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  };

  const isUpcoming = !isPastEvent() && !event.is_cancelled;
  const canPurchaseTickets = event.external_ticket_link && isUpcoming;

  return (
    <div 
      className={`relative w-full h-full bg-gray-900 overflow-hidden ${className}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {hasVideo && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            poster={previewImage || event.image}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <Image
            src={previewImage || event.image}
            alt={event.title}
            fill
            className="object-cover"
            priority={isActive}
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Video Controls */}
      {hasVideo && (
        <>
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
        </>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
        {/* Top Section */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            {/* Event Status Badges */}
            <div className="flex gap-2">
              {event.featured && (
                <Badge className="bg-yellow-600 text-white">
                  ⭐ Featured
                </Badge>
              )}
              {event.is_cancelled && (
                <Badge className="bg-red-600 text-white">
                  ❌ Cancelled
                </Badge>
              )}
              {!isPastEvent() && !event.is_cancelled && (
                <Badge className="bg-green-600 text-white">
                  🎉 Upcoming
                </Badge>
              )}
            </div>

            {/* Event Category */}
            <div className="bg-blue-600 rounded-full px-3 py-1 flex items-center gap-2 w-fit">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                {event.category || 'Event'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 items-center">
            {/* Like Button */}
            {onLike && (
              <button
                onClick={onLike}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isLiked 
                    ? 'bg-red-600 scale-110' 
                    : 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30'
                }`}>
                  <Heart 
                    className={`w-6 h-6 transition-all ${
                      isLiked ? 'text-white fill-white' : 'text-white'
                    }`} 
                  />
                </div>
                <span className="text-white text-sm font-medium">
                  {likeCount > 0 ? likeCount : ''}
                </span>
              </button>
            )}

            {/* Share Button */}
            {onShare && (
              <button
                onClick={onShare}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
            )}

            {/* RSVP Button */}
            {onRSVP && (
              <button
                onClick={onRSVP}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isRSVPed 
                    ? 'bg-green-600 scale-110' 
                    : 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30'
                }`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-medium">
                  {rsvpCount > 0 ? rsvpCount : ''}
                </span>
              </button>
            )}

            {/* Vote Button */}
            {onVote && (
              <button
                onClick={onVote}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Vote</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          {/* Event Details */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <h2 className="text-white text-2xl font-bold mb-2">{event.title}</h2>
            
            <div className="flex items-center gap-4 text-white/80 text-sm mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(event.date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-white/90 text-sm leading-relaxed mb-3">
                {event.description}
              </p>
            )}

            {/* Price */}
            {event.price !== undefined && (
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">
                  {formatPrice(event.price)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {canPurchaseTickets && (
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  asChild
                >
                  <a href={event.external_ticket_link} target="_blank" rel="noopener noreferrer">
                    <Ticket className="w-4 h-4 mr-2" />
                    Get Tickets
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              )}
              
              {isUpcoming && !canPurchaseTickets && (
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={onRSVP}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {isRSVPed ? 'Going!' : 'RSVP'}
                </Button>
              )}
            </div>
          </div>
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