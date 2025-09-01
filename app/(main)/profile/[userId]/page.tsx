'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Calendar, MapPin, Heart, MessageCircle, Edit, Coffee, Music, Instagram, Sparkles, Users, MapPin as LocationIcon } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  profile_image_url: string;
  bio: string;
  location: string;
  created_at: string;
  wolfpack_status: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  // Wolfpack-specific fields
  wolf_emoji: string;
  vibe_status: string;
  favorite_drink: string;
  favorite_song: string;
  instagram_handle: string;
  looking_for: string;
  gender: string;
  pronouns: string;
  favorite_bartender: string;
  city: string;
  state: string;
  occupation: string;
}

interface UserPost {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  likes_count: number;
  content_comments_count: number;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id',userId)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setError('User not found');
          return;
        }

        setProfile(profileData);

        // Load user posts
        const { data: postsData, error: postsError } = await supabase
          .from('content_posts')
          .select('*')
          .eq('user_id',userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!postsError && postsData) {
          setPosts(postsData.map(post => ({
            id: post.id,
            title: post.title || '',
            description: post.description || '',
            video_url: post.video_url,
            thumbnail_url: post.thumbnail_url,
            likes_count: post.like_count || 0,
            content_comments_count: 0, // Would need to count from content_comments table
            created_at: post.created_at
          })));
        }

        // Check if current user is following this user
        if (currentUser && currentUser.id !==userId) {
          const { data: followData } = await supabase
            .from('social_follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id',userId)
            .single();

          setIsFollowing(!!followData);
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
    if (!currentUser || currentUser.id ===userId) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id',userId);

        if (!error) {
          setIsFollowing(false);
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('social_follows')
          .insert({
            follower_id: currentUser.id,
            following_id:userId
          });

        if (!error) {
          setIsFollowing(true);
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handlePostClick = (postId: string) => {
    // Navigate to the TikTok-style feed focused on this video
    router.push(`/social/feed?videoId=${postId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">{error || 'Profile not found'}</h2>
          <button 
            onClick={() => router.push('/social/feed')}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || `${profile.first_name} ${profile.last_name}`.trim() || 'Anonymous';
  const avatarUrl = profile.avatar_url || profile.profile_image_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';

  // Debug logging for edit button visibility
  console.log('Profile page debug:', {
    currentUserId: currentUser?.id,
    profileUserId:userId,
    shouldShowEdit: currentUser && currentUser.id ===userId
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => router.push('/social/feed')}
          className="flex items-center gap-2 text-white hover:text-red-400"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-lg font-bold">Profile</h1>
        <div className="w-16"></div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <div className="relative">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={120}
              height={120}
              className="rounded-full object-cover border-4 border-red-500"
            />
            {profile.wolfpack_status === 'active' && (
              <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">{displayName}</h1>
            {profile.username && (
              <p className="text-gray-400 mb-3">@{profile.username}</p>
            )}
            
            {profile.bio && (
              <p className="text-gray-300 mb-4">{profile.bio}</p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-sm text-gray-400">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <div className="font-bold">{posts.length}</div>
                <div className="text-sm text-gray-400">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{profile.followers_count || 0}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{profile.following_count || 0}</div>
                <div className="text-sm text-gray-400">Following</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Edit Profile Button - Only show for own profile */}
              {currentUser && currentUser.id ===userId && (
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="px-6 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              
              {/* Follow Button - Only show for other users */}
              {currentUser && currentUser.id !==userId && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wolfpack Profile Info */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Personality Card */}
            {(profile.wolf_emoji || profile.vibe_status || profile.looking_for) && (
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-lg">Personality</h3>
                </div>
                <div className="space-y-3">
                  {profile.wolf_emoji && (
                    <div className="space-y-1">
                      <div className="text-red-400 text-sm font-medium">Wolf Spirit</div>
                      <div className="flex items-center gap-3 pl-6">
                        <span className="text-3xl">{profile.wolf_emoji}</span>
                        <span className="text-gray-200">My pack vibe</span>
                      </div>
                    </div>
                  )}
                  {profile.vibe_status && (
                    <div className="space-y-1">
                      <div className="text-red-400 text-sm font-medium">Current Vibe</div>
                      <div className="text-gray-200 font-medium pl-6">{profile.vibe_status}</div>
                    </div>
                  )}
                  {profile.looking_for && (
                    <div className="space-y-1">
                      <div className="text-red-400 text-sm font-medium">Looking For</div>
                      <div className="text-gray-200 font-medium pl-6">{profile.looking_for}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Card */}
            {(profile.favorite_drink || profile.favorite_song || profile.favorite_bartender) && (
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-lg">Favorites</h3>
                </div>
                <div className="space-y-3">
                  {profile.favorite_drink && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <Coffee className="w-4 h-4" />
                        <span>Favorite Drink</span>
                      </div>
                      <div className="text-gray-200 font-medium pl-6">{profile.favorite_drink}</div>
                    </div>
                  )}
                  {profile.favorite_song && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <Music className="w-4 h-4" />
                        <span>Favorite Song</span>
                      </div>
                      <div className="text-gray-200 font-medium pl-6">{profile.favorite_song}</div>
                    </div>
                  )}
                  {profile.favorite_bartender && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <Users className="w-4 h-4" />
                        <span>Favorite Bartender</span>
                      </div>
                      <div className="text-gray-200 font-medium pl-6">{profile.favorite_bartender}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Personal Info Card */}
            {(profile.pronouns || profile.occupation || profile.city || profile.state) && (
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-lg">About Me</h3>
                </div>
                <div className="space-y-3">
                  {profile.pronouns && (
                    <div className="space-y-1">
                      <div className="text-red-400 text-sm font-medium">Pronouns</div>
                      <div className="text-gray-200 font-medium pl-6">{profile.pronouns}</div>
                    </div>
                  )}
                  {profile.occupation && (
                    <div className="space-y-1">
                      <div className="text-red-400 text-sm font-medium">Occupation</div>
                      <div className="text-gray-200 font-medium pl-6">{profile.occupation}</div>
                    </div>
                  )}
                  {(profile.city || profile.state) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <LocationIcon className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                      <div className="text-gray-200 font-medium pl-6">
                        {[profile.city, profile.state].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Links Card */}
            {profile.instagram_handle && (
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Instagram className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-lg">Social Links</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-red-400 text-sm font-medium">Instagram</div>
                    <div className="pl-6">
                      <a 
                        href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors font-medium"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>@{profile.instagram_handle.replace('@', '')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wolfpack Status Card */}
            {profile.wolfpack_status && (
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl p-5 border border-red-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🐺</span>
                  <h3 className="font-bold text-white text-lg">Wolfpack Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="text-red-400 text-sm font-medium">Pack Member</div>
                    <div className="pl-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                        profile.wolfpack_status === 'active' ? 'bg-red-600 text-white' :
                        profile.wolfpack_status === 'pending' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        <span className="capitalize">{profile.wolfpack_status}</span> Wolf
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-red-400 text-sm font-medium">Member Since</div>
                    <div className="text-gray-200 font-medium pl-6">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-gray-800 pt-8">
          <h2 className="text-xl font-bold mb-4">Posts</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {post.video_url ? (
                    <video
                      src={post.video_url}
                      poster={post.thumbnail_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : post.thumbnail_url ? (
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  
                  {/* Overlay with stats */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="flex items-center gap-4 text-white text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.content_comments_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}