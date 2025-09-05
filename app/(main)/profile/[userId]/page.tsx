'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin, 
  Heart, 
  MessageCircle, 
  Edit, 
  MoreVertical,
  Briefcase,
  Globe,
  Shield,
  CheckCircle,
  Play,
  Image as ImageIcon,
  Share2,
  UserPlus,
  UserMinus,
  Ban
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
  last_seen_at: string | null;
  // Social media fields
  website: string | null;
  // Professional fields
  occupation: string | null;
  company: string | null;
  // Personal fields
  gender: string | null;
  pronouns: string | null;
  date_of_birth: string | null;
  // Status fields
  is_verified: boolean | null;
  is_private: boolean | null;
  account_status: string | null;
  // Settings
  email_notifications: boolean | null;
  push_notifications: boolean | null;
}

interface ProfileStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes: number;
  total_views: number;
}

interface UserPost {
  id: string;
  post_type: 'video' | 'image' | 'text' | 'carousel' | null;
  caption: string | null;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  images: string[] | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  shares_count: number;
  created_at: string;
  visibility: 'public' | 'followers' | 'private' | null;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    total_likes: 0,
    total_views: 0
  });
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile with RPC function that includes stats
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_user_profile_with_counts', { target_user_id: userId });

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setError('User not found');
          return;
        }

        setProfile(profileData.user);
        setStats({
          followers_count: profileData.followers_count || 0,
          following_count: profileData.following_count || 0,
          posts_count: profileData.posts_count || 0,
          total_likes: profileData.total_likes || 0,
          total_views: profileData.total_views || 0
        });

        // Load user posts
        const { data: postsData, error: postsError } = await supabase
          .from('content_posts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!postsError && postsData) {
          setPosts(postsData);
        }

        // Check relationship status if logged in
        if (currentUser && currentUser.id !== userId) {
          // Check if following
          const { data: followData } = await supabase
            .from('social_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .single();

          setIsFollowing(!!followData);

          // Check if blocked
          const { data: blockData } = await supabase
            .from('social_blocks')
            .select('id')
            .eq('blocker_id', currentUser.id)
            .eq('blocked_id', userId)
            .single();

          setIsBlocked(!!blockData);
        }

      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || currentUser.id === userId) return;

    try {
      const { error } = await supabase
        .rpc('toggle_follow', { target_user_id: userId });

      if (!error) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({
          ...prev,
          followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || currentUser.id === userId) return;

    try {
      if (isBlocked) {
        const { error } = await supabase
          .rpc('unblock_user', { target_user_id: userId });
        
        if (!error) {
          setIsBlocked(false);
        }
      } else {
        const { error } = await supabase
          .rpc('block_user', { target_user_id: userId });
        
        if (!error) {
          setIsBlocked(true);
          setIsFollowing(false);
        }
      }
    } catch (err) {
      console.error('Error toggling block:', err);
    }
  };

  const handleMessage = () => {
    router.push(`/messages/new?userId=${userId}`);
  };

  const handlePostClick = (postId: string) => {
    // Only allow clicking on own posts for now
    if (isOwnProfile) {
      // TODO: Add post edit/delete modal or page
      console.log('Post clicked for editing:', postId);
      // For now, just prevent navigation to non-existent page
      return;
    }
    // Disable clicking on other users' posts
    return;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">{error || 'Profile not found'}</h2>
          <Button onClick={() => router.push('/social')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || `${profile.first_name} ${profile.last_name}`.trim() || 'Anonymous';
  const avatarUrl = profile.avatar_url || profile.profile_image_url || '/default-avatar.png';
  const isOwnProfile = currentUser && currentUser.id === userId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/social')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-semibold">{displayName}</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigator.share?.({ 
                title: displayName,
                text: `Check out ${displayName}'s profile`,
                url: window.location.href 
              })}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Profile
              </DropdownMenuItem>
              {!isOwnProfile && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleBlock}
                    className="text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {isBlocked ? 'Unblock' : 'Block'} User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-border"
                />
                {profile.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.is_private && (
                  <div className="inline-flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Private Account
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mb-4 whitespace-pre-wrap">{profile.bio}</p>
              )}

              {/* Profile Details */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                {profile.occupation && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.occupation}
                    {profile.company && ` at ${profile.company}`}
                  </div>
                )}
                {(profile.city || profile.state || profile.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                  </div>
                )}
                {profile.website && (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-6">
                <div className="text-center md:text-left">
                  <div className="font-bold text-lg">{formatNumber(stats.posts_count)}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <button 
                  className="text-center md:text-left hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/profile/${userId}/followers`)}
                >
                  <div className="font-bold text-lg">{formatNumber(stats.followers_count)}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </button>
                <button 
                  className="text-center md:text-left hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/profile/${userId}/following`)}
                >
                  <div className="font-bold text-lg">{formatNumber(stats.following_count)}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <>
                    <Button
                      onClick={() => router.push('/profile/edit')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={() => router.push('/settings')}
                      variant="outline"
                    >
                      Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className="flex items-center gap-2"
                      disabled={isBlocked}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleMessage}
                      variant="outline"
                      disabled={isBlocked || !!profile.is_private}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'liked')}>
          <TabsList className="w-full justify-start border-b rounded-none h-12">
            <TabsTrigger value="posts" className="flex-1">
              Posts
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1">
              Liked
            </TabsTrigger>
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-0">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No posts yet</p>
                {isOwnProfile && (
                  <Button 
                    className="mt-4"
                    onClick={() => router.push('/social/create')}
                  >
                    Create First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className={`relative aspect-square bg-muted overflow-hidden transition-opacity ${
                      isOwnProfile ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* Thumbnail */}
                    {post.post_type === 'video' && post.thumbnail_url ? (
                      <>
                        <Image
                          src={post.thumbnail_url}
                          alt={post.caption || 'Post'}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                          <Play className="w-4 h-4 text-white" fill="white" />
                        </div>
                      </>
                    ) : post.post_type === 'video' && post.video_url ? (
                      <>
                        <video
                          src={post.video_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                          <Play className="w-4 h-4 text-white" fill="white" />
                        </div>
                      </>
                    ) : post.post_type === 'image' && post.images?.[0] ? (
                      <>
                        <Image
                          src={post.images[0]}
                          alt={post.caption || 'Post'}
                          fill
                          className="object-cover"
                        />
                        {post.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5">
                            <span className="text-xs text-white font-medium">
                              1/{post.images.length}
                            </span>
                          </div>
                        )}
                      </>
                    ) : post.thumbnail_url ? (
                      <Image
                        src={post.thumbnail_url}
                        alt={post.caption || 'Post'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Hover Overlay with Stats */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-5 h-5" fill="white" />
                          <span className="font-medium">{formatNumber(post.likes_count)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-5 h-5" fill="white" />
                          <span className="font-medium">{formatNumber(post.comments_count)}</span>
                        </div>
                        {isOwnProfile && (
                          <div className="absolute top-2 left-2 text-xs bg-primary px-2 py-1 rounded">
                            Edit
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Liked Posts (placeholder) */}
          <TabsContent value="liked" className="mt-0">
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Heart className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No liked posts yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}