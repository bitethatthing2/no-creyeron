'use client';

import { SimpleInteractionButton } from './SimpleInteractionButton';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Plus } from 'lucide-react';

export default function AuthTest() {
  const { user, loading } = useAuth();

  const handleLike = async () => {
    console.log('Like action executed!');
    alert('Like action would happen here!');
  };

  const handleComment = async () => {
    console.log('Comment action executed!');
    alert('Comment action would happen here!');
  };

  const handlePost = async () => {
    console.log('Post action executed!');
    alert('Post creation would happen here!');
  };

  const handleShare = async () => {
    console.log('Share action executed!');
    alert('Share action would happen here!');
  };

  if (loading) {
    return <div className="p-4 text-white">Loading auth state...</div>;
  }

  return (
    <div className="p-8 bg-zinc-900 text-white max-w-md mx-auto rounded-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
      
      <div className="mb-4 p-4 bg-zinc-800 rounded">
        <p><strong>User Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Actions Requiring Auth:</h3>
          <div className="flex gap-2">
            <SimpleInteractionButton
              onInteract={handleLike}
              requiresAuth={true}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Heart className="w-4 h-4" />
              Like
            </SimpleInteractionButton>

            <SimpleInteractionButton
              onInteract={handleComment}
              requiresAuth={true}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="w-4 h-4" />
              Comment
            </SimpleInteractionButton>

            <SimpleInteractionButton
              onInteract={handlePost}
              requiresAuth={true}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Post
            </SimpleInteractionButton>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Actions NOT Requiring Auth:</h3>
          <SimpleInteractionButton
            onInteract={handleShare}
            requiresAuth={false}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Share (No Auth Required)
          </SimpleInteractionButton>
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-400">
        <p>• If not logged in, clicking auth-required buttons should redirect to /login</p>
        <p>• After login, you should return to this page</p>
        <p>• Share button should work without login</p>
      </div>
    </div>
  );
}