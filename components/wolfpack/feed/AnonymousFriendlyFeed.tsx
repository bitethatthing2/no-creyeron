'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleInteractionButton as InteractionButton } from '@/components/auth/SimpleInteractionButton';
import { AuthGate } from '@/components/auth/AuthGate';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { Heart, MessageCircle, Share2, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface FeedPost {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url?: string;
  image_url?: string;
  likes_count: number;
  wolfpack_comments_count: number;
  shares_count: number;
  created_at: string;
  is_liked?: boolean; // Only available for authenticated users
}

interface AnonymousFriendlyFeedProps {
  posts: FeedPost[];
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
}

export default function AnonymousFriendlyFeed({
  posts,
  onLoadMore,
  hasMore = false,
  isLoading = false
}: AnonymousFriendlyFeedProps) {
  const { user, loading } = useAuth();
  const { executeAction } = useProtectedAction();
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(posts);

  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Like functionality with optimistic updates
  const handleLike = async (postId: string) => {
    await executeAction(
      async () => {
        // Optimistic update
        setLocalPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const wasLiked = post.is_liked || false;
            return {
              ...post,
              is_liked: !wasLiked,
              likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1
            };
          }
          return post;
        }));

        // API call would go here
        // await likePost(postId);
        
        toast({
          title: "Post liked!",
          description: "Your reaction has been saved.",
        });
      },
      {
        authMessage: 'Redirecting to sign in...',
        requiresAuth: true
      }
    );
  };

  // Comment functionality
  const handleComment = async (postId: string) => {
    await executeAction(
      async () => {
        // Navigate to wolfpack_comments or open comment modal
        console.log('Opening wolfpack_comments for post:', postId);
        toast({
          title: "wolfpack_comments",
          description: "Comment feature would open here.",
        });
      },
      {
        authMessage: 'Redirecting to sign in...',
        requiresAuth: true
      }
    );
  };

  // Share functionality (no auth required)
  const handleShare = async (postId: string, post: FeedPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out this post by ${post.username}`,
          text: post.caption,
          url: `${window.location.origin}/wolfpack/video/${postId}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/wolfpack/video/${postId}`);
        toast({
          title: "Link copied!",
          description: "Share link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Follow functionality
  const handleFollow = async (userId: string, username: string) => {
    await executeAction(
      async () => {
        // API call would go here
        // await followUser(userId);
        
        toast({
          title: "Following!",
          description: `You are now following ${username}.`,
        });
      },
      {
        authMessage: 'Redirecting to sign in...',
        requiresAuth: true
      }
    );
  };

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Wolf Pack Feed</h1>
          
          {/* Create Post Button - Protected */}
          <AuthGate 
            fallback={
              <Button 
                onClick={() => window.location.href = '/login'}
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Sign In to Post
              </Button>
            }
          >
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-1" />
              Create Post
            </Button>
          </AuthGate>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-0">
        {localPosts.map((post) => (
          <div key={post.id} className="relative bg-black border-b border-zinc-800">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  {post.avatar_url ? (
                    <img 
                      src={post.avatar_url} 
                      alt={post.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{post.username}</p>
                  <p className="text-zinc-400 text-xs">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Follow Button */}
              <InteractionButton
                onInteract={() => handleFollow(post.user_id, post.username)}
                requiresAuth={true}
                authMessage="Redirecting to sign in..."
                className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                variant="ghost"
                size="sm"
              >
                Follow
              </InteractionButton>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-2">
              <p className="text-white text-sm leading-relaxed">{post.caption}</p>
            </div>

            {/* Media */}
            {(post.video_url || post.image_url) && (
              <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                {post.video_url ? (
                  <video 
                    src={post.video_url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : post.image_url ? (
                  <img 
                    src={post.image_url}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-zinc-500 text-sm">Media content</div>
                )}
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between p-4 pt-3">
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <InteractionButton
                  onInteract={() => handleLike(post.id)}
                  requiresAuth={true}
                  authMessage="Redirecting to sign in..."
                  className="flex items-center space-x-2 group"
                  variant="ghost"
                  size="sm"
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-200 ${
                      post.is_liked ? 'fill-red-500 text-red-500' : 'text-zinc-400 group-hover:text-red-500'
                    }`}
                  />
                  <span className="text-sm text-zinc-400">
                    {post.likes_count > 0 ? post.likes_count.toLocaleString() : ''}
                  </span>
                </InteractionButton>

                {/* Comment Button */}
                <InteractionButton
                  onInteract={() => handleComment(post.id)}
                  requiresAuth={true}
                  authMessage="Redirecting to sign in..."
                  className="flex items-center space-x-2 group"
                  variant="ghost"
                  size="sm"
                >
                  <MessageCircle className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm text-zinc-400">
                    {post.wolfpack_comments_count > 0 ? post.wolfpack_comments_count.toLocaleString() : ''}
                  </span>
                </InteractionButton>
              </div>

              {/* Share Button - No auth required */}
              <InteractionButton
                onInteract={() => handleShare(post.id, post)}
                requiresAuth={false}
                className="flex items-center space-x-2 group"
                variant="ghost"
                size="sm"
              >
                <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-green-500 transition-colors" />
                <span className="text-sm text-zinc-400">Share</span>
              </InteractionButton>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}

      {/* Auth Prompt for Better Experience */}
      {!user && localPosts.length > 0 && (
        <div className="sticky bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4">
          <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 p-4 text-center">
            <p className="text-white text-sm font-medium mb-2">
              Enjoying the content?
            </p>
            <p className="text-zinc-400 text-xs mb-3">
              Sign in to like, comment, and connect with the Wolf Pack community!
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
              size="sm"
            >
              Join the Pack
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}