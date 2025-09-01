'use client';

import * as React from 'react';
import { X, Link, Facebook, Twitter, MessageCircle, Mail } from 'lucide-react';
import { getZIndexClass } from '@/lib/constants/z-index';
import { toast } from 'sonner'; // Using sonner for toast notifications
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  contentId: string; // Generic content ID (could be post, video, etc.)
  contentType?: 'post' | 'video' | 'image';
  caption?: string;
  username?: string;
}

export default function ShareModal({ 
  isOpen, 
  onCloseAction, 
  contentId, 
  contentType = 'post',
  caption, 
  username 
}: ShareModalProps) {
  const { currentUser } = useAuth();
  const [copying, setCopying] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create appropriate URL based on content type
      const baseUrl = window.location.origin;
      let url = '';
      
      switch (contentType) {
        case 'video':
          url = `${baseUrl}/videos/${contentId}`;
          break;
        case 'image':
          url = `${baseUrl}/images/${contentId}`;
          break;
        case 'post':
        default:
          url = `${baseUrl}/posts/${contentId}`;
          break;
      }
      
      setShareUrl(url);
    }
  }, [contentId, contentType]);

  const shareText = `Check out this ${contentType} by ${username || 'a user'}: ${caption || ''} #SideHustle`;

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(shareUrl);
      
      // Track the share in content_interactions table
      if (currentUser) {
        await trackShare('copy_link');
      }
      
      toast.success('Link copied!', {
        description: 'Share link has been copied to clipboard'
      });
      onCloseAction();
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Copy failed', {
        description: 'Please try again'
      });
    } finally {
      setCopying(false);
    }
  };

  const trackShare = async (platform: string) => {
    if (!currentUser) return;

    try {
      // First check if user already shared this
      const { data: existing } = await supabase
        .from('content_interactions')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('content_id', contentId)
        .eq('interaction_type', 'share')
        .maybeSingle();

      if (!existing) {
        // Record the share interaction
        const { error: interactionError } = await supabase
          .from('content_interactions')
          .insert({
            user_id: currentUser.id,
            content_id: contentId,
            interaction_type: 'share'
          });

        if (interactionError && interactionError.code !== '23505') {
          console.error('Error tracking share:', interactionError);
        }
      }

      // Update share count on the post
      const { data: postData } = await supabase
        .from('content_posts')
        .select('shares_count')
        .eq('id', contentId)
        .single();

      if (postData) {
        const { error: updateError } = await supabase
          .from('content_posts')
          .update({ 
            shares_count: (postData.shares_count || 0) + 1 
          })
          .eq('id', contentId);

        if (updateError) {
          console.error('Error updating share count:', updateError);
        }
      }

      // Log share details
      console.log(`Share tracked: ${platform} for content ${contentId}`);
      
    } catch (error) {
      console.error('Error tracking share:', error);
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
        url = `mailto:?subject=Check out this ${contentType}&body=${textEncoded} ${shareUrlEncoded}`;
        break;
      default:
        return;
    }

    // Track the share
    if (currentUser) {
      await trackShare(platform);
    }

    window.open(url, '_blank', 'width=600,height=600');
    onCloseAction();
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseAction} />
      
      {/* Share modal - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col max-h-[60vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-center p-4 relative border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-1 bg-gray-400 dark:bg-gray-600 rounded-full absolute top-2"></div>
          <h2 className="text-gray-900 dark:text-gray-100 text-lg font-semibold mt-2">
            Share to...
          </h2>
          <button
            onClick={onCloseAction}
            className="absolute right-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
            title="Close"
            aria-label="Close"
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
                      ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' 
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transform hover:scale-105 active:scale-95
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-3
                    ${option.primary ? 'bg-white/20' : 'bg-white dark:bg-gray-700 shadow-sm'}
                  `}>
                    <IconComponent 
                      className={`h-6 w-6 ${
                        option.primary 
                          ? 'text-white' 
                          : option.color || 'text-gray-600 dark:text-gray-400'
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
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Preview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {shareText}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 break-all">
              {shareUrl}
            </p>
          </div>
        </div>

        {/* Bottom padding for mobile safe area */}
        <div className={styles.safeAreaBottom} />
      </div>
    </div>
  );
}