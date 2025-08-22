'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoComments } from '@/lib/hooks/useVideoComments';
import { useLikeVideo } from '@/lib/hooks/useLikeVideo';
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react';
import { Database } from '@/types/supabase';

// Type definitions based on your database schema
type User = Database['public']['Tables']['users']['Row'];
type Video = Database['public']['Tables']['content_posts']['Row'];
type Comment = Database['public']['Tables']['content_comments']['Row'];

// Extended types with relations
interface VideoWithUser extends Video {
  users: Pick<User, 'username' | 'display_name' | 'first_name' | 'last_name' | 'avatar_url' | 'profile_image_url'> | null;
}

interface CommentWithUser extends Comment {
  user?: Pick<User, 'avatar_url' | 'display_name' | 'username'> | null;
  replies?: CommentWithUser[];
}

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState<VideoWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  
  const { 
    comments, 
    loading: commentsLoading, 
    addComment
  } = useVideoComments(videoId);
  
  const { 
    toggleLike, 
    loading: likingVideo 
  } = useLikeVideo();

  // Load video details
  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) return;

      try {
        const { data, error } = await supabase
          .from('content_posts')
          .select(`
            *,
            users (
              username,
              display_name,
              first_name,
              last_name,
              avatar_url,
              profile_image_url
            )
          `)
          .eq('id', videoId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error loading video:', error);
          return;
        }

        if (data) {
          setVideo(data as VideoWithUser);
        }

        // Check if user liked this video
        if (user) {
          const { data: likeData } = await supabase
            .from('wolfpack_post_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('video_id', videoId)
            .single();

          setIsLiked(!!likeData);
        }
      } catch (err) {
        console.error('Error loading video:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, user]);

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like videos');
      return;
    }

    try {
      const result = await toggleLike(videoId, isLiked);

      if (result.success) {
        setIsLiked(!isLiked);
        // Update video like count
        setVideo(prev => {
          if (!prev) return null;
          
          const currentLikeCount = prev.like_count || prev.likes_count || 0;
          const newLikeCount = isLiked 
            ? Math.max(0, currentLikeCount - 1)
            : currentLikeCount + 1;
          
          return {
            ...prev,
            likes_count: newLikeCount,
            like_count: newLikeCount
          };
        });
      } else {
        console.error('Failed to toggle like:', result.error);
      }
    } catch (err) {
      console.error('Error handling like:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const success = await addComment(commentText.trim());
    if (success) {
      setCommentText('');
      // Update video comment count
      setVideo(prev => {
        if (!prev) return null;
        
        const currentCommentCount = prev.comment_count || prev.comments_count || 0;
        
        return {
          ...prev,
          comments_count: currentCommentCount + 1,
          comment_count: currentCommentCount + 1
        };
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Video not found</h2>
          <button 
            type="button"
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get display values with proper fallbacks
  const userDisplayName = video.users?.display_name || video.users?.username || 'Anonymous';
  const userAvatar = video.users?.avatar_url || video.users?.profile_image_url || '/icons/wolf-icon.png';
  const likeCount = video.like_count || video.likes_count || 0;
  const commentCount = video.comment_count || video.comments_count || 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white hover:text-red-400"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-lg font-bold">Wolf Pack Video</h1>
        <div className="w-16"></div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Section */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {video.video_url ? (
            <video
              src={video.video_url}
              poster={video.thumbnail_url || undefined}
              controls
              className="max-w-full max-h-full rounded-lg"
            />
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No video available</p>
              <p className="text-white mt-2">{video.caption || video.description}</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="w-full lg:w-96 border-l border-gray-800 flex flex-col">
          {/* Video Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={userAvatar}
                alt="Avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(video.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {video.caption && (
              <p className="text-sm text-gray-300 mb-3">{video.caption}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                disabled={likingVideo}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                aria-label={isLiked ? 'Unlike video' : 'Like video'}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>
              
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{commentCount}</span>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-400 text-center">No comments yet. Be the first to comment!</p>
            ) : (
              (comments as CommentWithUser[]).map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Image
                      src={comment.user?.avatar_url || '/icons/wolf-icon.png'}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold text-sm text-white mb-1">
                          {comment.user?.display_name || comment.user?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-300">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-3">
                        {new Date(comment.created_at || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Image
                            src={reply.user?.avatar_url || '/icons/wolf-icon.png'}
                            alt="Avatar"
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-700 rounded-lg p-2">
                              <p className="font-semibold text-xs text-white mb-1">
                                {reply.user?.display_name || reply.user?.username || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-300">{reply.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-2">
                              {new Date(reply.created_at || '').toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <Image
                  src={user.user_metadata?.avatar_url || '/icons/wolf-icon.png'}
                  alt="Your avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                />
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-800 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                    aria-label="Send comment"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-800 text-center">
              <p className="text-gray-400 text-sm">
                Please log in to comment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}