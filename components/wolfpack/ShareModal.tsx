'use client';

import { useState } from 'react';
import { X, Link, Facebook, Twitter, MessageCircle, Mail, Download } from 'lucide-react';
import { getZIndexClass } from '@/lib/constants/z-index';
import { toast } from '@/components/ui/use-toast';
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import { useAuth } from '@/contexts/AuthContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  caption?: string;
  username?: string;
}

export default function ShareModal({ isOpen, onClose, videoId, caption, username }: ShareModalProps) {
  const { user } = useAuth();
  const [copying, setCopying] = useState(false);

  const shareUrl = `${window.location.origin}/wolfpack/video/${videoId}`;
  const shareText = `Check out this video by ${username || 'Wolf Pack member'}: ${caption || ''} #WolfPack #SideHustleBar`;

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(shareUrl);
      
      // Track the share
      if (user) {
        await wolfpackService.trackShare(videoId, user.id, 'copy_link');
      }
      
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard'
      });
      onClose();
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Copy failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setCopying(false);
    }
  };

  const handleSocialShare = async (platform: string) => {
    const shareUrlEncoded = encodeURIComponent(shareUrl);
    const textEncoded = encodeURIComponent(shareText);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${shareUrlEncoded}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${textEncoded} ${shareUrlEncoded}`;
        break;
      case 'email':
        url = `mailto:?subject=Check out this Wolf Pack video&body=${textEncoded} ${shareUrlEncoded}`;
        break;
      default:
        return;
    }

    // Track the share
    if (user) {
      await wolfpackService.trackShare(videoId, user.id, platform);
    }

    window.open(url, '_blank', 'width=600,height=600');
    onClose();
  };

  const shareOptions = [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: Link,
      onClick: handleCopyLink,
      primary: true
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: () => handleSocialShare('whatsapp'),
      color: 'text-green-600'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      onClick: () => handleSocialShare('facebook'),
      color: 'text-blue-600'
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      onClick: () => handleSocialShare('twitter'),
      color: 'text-blue-400'
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: () => handleSocialShare('email'),
      color: 'text-gray-600'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${getZIndexClass('NOTIFICATION')} flex flex-col`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Share modal - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col max-h-[60vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-center p-4 relative border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-400 rounded-full absolute top-2"></div>
          <h2 className="text-gray-900 text-lg font-semibold mt-2">
            Share to...
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Share options */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-4">
            {shareOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  disabled={option.id === 'copy' && copying}
                  className={`
                    flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-200
                    ${option.primary 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transform hover:scale-105 active:scale-95
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3
                    ${option.primary ? 'bg-white/20' : 'bg-white shadow-sm'}
                  `}>
                    <IconComponent 
                      className={`h-6 w-6 ${
                        option.primary 
                          ? 'text-white' 
                          : option.color || 'text-gray-600'
                      }`} 
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {option.id === 'copy' && copying ? 'Copying...' : option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {shareText}
            </p>
            <p className="text-xs text-gray-500 break-all">
              {shareUrl}
            </p>
          </div>
        </div>

        {/* Bottom padding for mobile safe area */}
        <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>
  );
}