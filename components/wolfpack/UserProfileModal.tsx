'use client';

import { useState, useEffect } from 'react';
import { CenteredModal } from '@/components/shared/CenteredModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarWithFallback } from '@/components/shared/ImageWithFallback';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatJoinDate, formatLastSeen } from '@/lib/utils/date-utils';
import { resolveAvatarUrl } from '@/lib/utils/avatar-utils';
import { 
  MessageCircle, 
  Coffee, 
  Music, 
  Instagram, 
  Sparkles,
  User,
  Calendar,
  MapPin
} from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  favorite_drink: string | null;
  favorite_song: string | null;
  instagram_handle: string | null;
  vibe_status: string | null;
  wolf_emoji: string | null;
  profile_image_url: string | null;
  profile_pic_url: string | null;
  wolfpack_joined_at: string | null;
  wolfpack_tier: string | null;
  is_online: boolean | null;
  last_activity: string | null;
  location_id: string | null;
  allow_messages: boolean | null;
  is_profile_visible: boolean | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  userId, 
  userDisplayName,
  userAvatarUrl 
}: UserProfileModalProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
    }
  }, [isOpen, userId]);

  // Add/remove class to body when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('profile-modal-open');
    } else {
      document.body.classList.remove('profile-modal-open');
    }

    return () => {
      document.body.classList.remove('profile-modal-open');
    };
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          bio,
          favorite_drink,
          favorite_song,
          instagram_handle,
          vibe_status,
          wolf_emoji,
          profile_image_url,
          profile_pic_url,
          wolfpack_joined_at,
          wolfpack_tier,
          is_online,
          last_activity,
          location_id,
          allow_messages,
          is_profile_visible
        `)
        .eq('auth_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = () => {
    if (!profile || !currentUser) return;
    
    // Navigate to private chat with this user
    router.push(`/wolfpack/chat/private/${userId}`);
    onClose();
  };

  const displayName = profile?.display_name || userDisplayName || 'Pack Member';
  const avatarUrl = resolveAvatarUrl({
    profile_image_url: profile?.profile_image_url,
    profile_pic_url: profile?.profile_pic_url,
    avatar_url: userAvatarUrl
  });
  const isCurrentUser = currentUser?.id === userId;
  const canMessage = profile?.allow_messages !== false && !isCurrentUser;

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${displayName}'s Profile`}
      maxWidth="md"
      className="!z-[999]"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUserProfile} variant="outline">
            Try Again
          </Button>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <AvatarWithFallback
                src={avatarUrl}
                alt={displayName}
                fallback={displayName}
                size="xl"
                className="ring-4 ring-primary/20"
              />
              {profile.is_online && (
                <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {displayName}
                {profile.wolf_emoji && (
                  <span className="text-2xl">{profile.wolf_emoji}</span>
                )}
              </h2>
              
              {profile.vibe_status && (
                <p className="text-muted-foreground mt-1">{profile.vibe_status}</p>
              )}
              
              <div className="flex items-center justify-center gap-2 mt-2">
                {profile.wolfpack_tier && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.wolfpack_tier} Wolf
                  </Badge>
                )}
                {profile.is_online ? (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Last seen {formatLastSeen(profile.last_activity)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {profile.bio && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">About</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{profile.bio}</p>
              </div>
            )}

            {profile.favorite_drink && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Favorite Drink</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{profile.favorite_drink}</p>
              </div>
            )}

            {profile.favorite_song && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Favorite Song</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{profile.favorite_song}</p>
              </div>
            )}

            {profile.instagram_handle && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Instagram</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">@{profile.instagram_handle}</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Pack Member Since</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {formatJoinDate(profile.wolfpack_joined_at)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {canMessage && (
              <Button 
                onClick={handleStartConversation}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onClose}
              className={canMessage ? "flex-1" : "w-full"}
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Profile not found or not visible</p>
        </div>
      )}
    </CenteredModal>
  );
}