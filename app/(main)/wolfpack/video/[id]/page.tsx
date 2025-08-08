'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoComments } from '@/lib/hooks/useVideoComments';
import { useLikeVideo } from '@/lib/hooks/useLikeVideo';
import { ArrowLeft, Heart, MessageCircle, Share, Send } from 'lucide-react';

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  
  const { comments, loading: commentsLoading, addComment, refreshComments } = useVideoComments(videoId);
  const { likeVideo, unlikeVideo, isLoading: likingVideo } = useLikeVideo();

  // Load video details
  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) return;

      try {
        const { data, error } = await supabase
          .from('wolfpack_videos')
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

        setVideo(data);

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
      alert('Please log in to like wolfpack_videos');
      return;
    }

    try {
      let success;
      if (isLiked) {
        success = await unlikeVideo(videoId);
      } else {
        success = await likeVideo(videoId);
      }

      if (success) {
        setIsLiked(!isLiked);
        // Update video like count
        setVideo(prev => prev ? {
          ...prev,
          likes_count: isLiked 
            ? Math.max(0, (prev.likes_count || 0) - 1)
            : (prev.likes_count || 0) + 1,
          like_count: isLiked 
            ? Math.max(0, (prev.like_count || 0) - 1)
            : (prev.like_count || 0) + 1
        } : null);
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
      setVideo(prev => prev ? {
        ...prev,
        wolfpack_comments_count: (prev.wolfpack_comments_count || 0) + 1,
        comment_count: (prev.comment_count || 0) + 1
      } : null);
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
            onClick={() => router.back()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white hover:text-red-400"
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
              poster={video.thumbnail_url}
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

        {/* wolfpack_comments Section */}
        <div className="w-full lg:w-96 border-l border-gray-800 flex flex-col">
          {/* Video Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={video.users?.avatar_url || video.users?.profile_image_url || '/icons/wolf-icon.png'}
                alt="Avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">
                  {video.users?.display_name || video.users?.username || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(video.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {video.caption && (
              <p className="text-sm text-gray-300 mb-3">{video.caption}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={likingVideo}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                  isLiked 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{video.likes_count || video.like_count || 0}</span>
              </button>
              
              <div className="flex items-center gap-2 text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{video.wolfpack_comments_count || video.comment_count || 0}</span>
              </div>
            </div>
          </div>

          {/* wolfpack_comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-400 text-center">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.user?.avatar_url || '/icons/wolf-icon.png'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="font-semibold text-sm text-white mb-1">
                          {comment.user?.display_name || comment.user?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-300">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-3">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <img
                            src={reply.user?.avatar_url || '/icons/wolf-icon.png'}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-700 rounded-lg p-2">
                              <p className="font-semibold text-xs text-white mb-1">
                                {reply.user?.display_name || reply.user?.username || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-300">{reply.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-2">
                              {new Date(reply.created_at).toLocaleString()}
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
                <img
                  src={user.user_metadata?.avatar_url || '/icons/wolf-icon.png'}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
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
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
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