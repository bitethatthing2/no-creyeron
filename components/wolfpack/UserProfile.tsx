'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { 
  X, 
  Edit, 
  MapPin, 
  Calendar,
  Heart,
  MessageCircle,
  Share,
  Star,
  Users,
  Trophy,
  Zap,
  Camera,
  Settings,
  Shield,
  Crown,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';

interface UserStats {
  followers: number;
  following: number;
  wolfpack_posts: number;
  likes: number;
  wolfpack_level: number;
  pack_coins: number;
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function UserProfile({ isOpen, onClose, userId }: UserProfileProps) {
  const { user } = useConsistentAuth();
  const [stats, setStats] = useState<UserStats>({
    followers: 1234,
    following: 567,
    wolfpack_posts: 89,
    likes: 12400,
    wolfpack_level: 8,
    pack_coins: 2890
  });
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    if (userId && user) {
      setIsOwnProfile(userId === user.id);
    }
  }, [userId, user]);


  const userProfile = {
    first_name: user?.user_metadata?.first_name || 'Mark',
    last_name: user?.user_metadata?.last_name || 'Kahler',
    username: user?.email?.split('@')[0] || 'mkahler599',
    email: user?.email || 'mkahler599@gmail.com',
    avatar_url: user?.user_metadata?.avatar_url || '/icons/wolf-icon.png',
    bio: 'Living the Wolf Pack life in Salem! 🐺 Side Hustle regular & pack leader',
    location: 'Salem, OR',
    joined_date: '2024-01-15',
    verified: true,
    pack_status: 'Alpha',
    favorite_drinks: ['Margarita', 'IPA', 'Whiskey Sour'],
    achievements: [
      { name: 'Pack Leader', icon: Crown, description: 'Leading the Salem pack' },
      { name: 'Regular', icon: Star, description: '100+ visits to Side Hustle' },
      { name: 'Social Butterfly', icon: Users, description: '50+ wolfpack connections' },
      { name: 'Video Creator', icon: Camera, description: '25+ wolfpack_videos posted' }
    ]
  };

  const recentwolfpack_posts = [
    {
      id: '1',
      thumbnail: '/icons/wolf-icon.png',
      likes: 3420,
      wolfpack_comments: 156,
      isVideo: true
    },
    {
      id: '2',
      thumbnail: '/icons/wolf-icon.png',
      likes: 5678,
      wolfpack_comments: 234,
      isVideo: true
    },
    {
      id: '3',
      thumbnail: '/icons/wolf-icon.png',
      likes: 4321,
      wolfpack_comments: 198,
      isVideo: true
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-gray-800 rounded-full p-2"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-white text-lg font-semibold">
            {isOwnProfile ? 'Your Profile' : `@${userProfile.username}`}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 rounded-full p-2"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
              <Image
                src={userProfile.avatar_url}
                alt="Profile"
                width={96}
                height={96}
                className="rounded-full"
              />
            </Avatar>
            {userProfile.verified && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            )}
            {userProfile.pack_status === 'Alpha' && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h2 className="text-white text-2xl font-bold mb-1">
            {userProfile.first_name} {userProfile.last_name}
          </h2>
          <p className="text-gray-400 text-lg mb-2">@{userProfile.username}</p>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">{userProfile.location}</span>
          </div>
          
          <p className="text-white text-center max-w-sm mx-auto mb-4">
            {userProfile.bio}
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                Joined {new Date(userProfile.joined_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwnProfile ? (
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                // Navigate to profile edit page
                window.location.href = '/profile/edit';
              }}
              className="flex-1 bg-white hover:bg-gray-200"
              style={{ color: 'black' }}
            >
              <Edit className="h-4 w-4 mr-2 text-black" />
              <span className="text-black font-medium">Edit Profile</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              onClick={() => {
                // TODO: Implement share functionality
                console.log('Share profile clicked');
              }}
            >
              <Share className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-white hover:bg-gray-200"
              style={{ color: 'black' }}
              onClick={() => {
                // TODO: Implement follow functionality
                console.log('Follow clicked');
              }}
            >
              <User className="h-4 w-4 mr-2 text-black" />
              <span className="text-black font-medium">Follow</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              onClick={() => {
                // TODO: Implement message functionality
                console.log('Message clicked');
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.followers}</div>
              <div className="text-gray-400 text-sm">Followers</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.following}</div>
              <div className="text-gray-400 text-sm">Following</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.wolfpack_posts}</div>
              <div className="text-gray-400 text-sm">wolfpack_posts</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.likes}</div>
              <div className="text-gray-400 text-sm">Likes</div>
            </CardContent>
          </Card>
        </div>

        {/* Wolf Pack Status */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-lg">Wolf Pack Level {stats.wolfpack_level}</div>
                <div className="text-purple-100 text-sm">Pack Coins: {stats.pack_coins}</div>
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Image
                  src="/icons/WOLFPACK-PAW.png"
                  alt="Wolf Pack"
                  width={32}
                  height={32}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {userProfile.achievements.map((achievement, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <achievement.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{achievement.name}</div>
                      <div className="text-gray-400 text-xs">{achievement.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-4">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-800">
            <div className="flex-1 py-3 text-center border-b-2 border-white">
              <div className="w-6 h-6 mx-auto mb-1">📱</div>
              <span className="text-white text-xs">wolfpack_posts</span>
            </div>
            <div className="flex-1 py-3 text-center">
              <div className="w-6 h-6 mx-auto mb-1">❤️</div>
              <span className="text-gray-400 text-xs">Liked</span>
            </div>
            {isOwnProfile && (
              <div className="flex-1 py-3 text-center">
                <div className="w-6 h-6 mx-auto mb-1">🔒</div>
                <span className="text-gray-400 text-xs">Private</span>
              </div>
            )}
          </div>

          {/* Content Area */}
          {recentwolfpack_posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {recentwolfpack_posts.map((post) => (
                <div key={post.id} className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                  <Image
                    src={post.thumbnail}
                    alt="Post thumbnail"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-1 left-1 flex items-center gap-1">
                    <Heart className="h-4 w-4 text-white" />
                    <span className="text-white text-xs">{post.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image
                  src="/icons/wolf-icon.png"
                  alt="No wolfpack_posts"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <p className="text-white text-lg mb-2">Share a fun video you've recorded recently</p>
              <Button className="bg-red-500 text-white hover:bg-red-600 rounded-lg px-8 py-3 mt-4">
                Upload
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}