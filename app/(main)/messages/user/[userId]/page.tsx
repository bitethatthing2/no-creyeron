'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessaging } from '@/lib/hooks/messaging';

export default function DirectMessageRedirect() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { getOrCreateDirectConversation, error: hookError } = useMessaging();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        console.log('🚀 DirectMessageRedirect: Starting redirect for userId:', userId);
        setIsRedirecting(true);
        setRedirectError(null);
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!userId || !uuidRegex.test(userId)) {
          console.error('❌ Invalid user ID format:', userId);
          setRedirectError('Invalid user ID format');
          setTimeout(() => {
            router.replace('/messages');
          }, 2000);
          return;
        }
        
        const conversationId = await getOrCreateDirectConversation(userId);
        console.log('🚀 DirectMessageRedirect: Got conversationId:', conversationId);
        
        if (conversationId) {
          console.log('✅ Redirecting to conversation:', conversationId);
          router.replace(`/messages/conversation/${conversationId}`);
        } else {
          // Check if there's a specific error from the hook
          const errorMessage = hookError || 'Could not create conversation. Please try again.';
          console.error('❌ Failed to get/create conversation:', errorMessage);
          setRedirectError(errorMessage);
          setTimeout(() => {
            router.replace('/messages');
          }, 2000);
        }
      } catch (err) {
        console.error('❌ Error in DirectMessageRedirect:', err);
        setRedirectError('An error occurred. Returning to messages...');
        setTimeout(() => {
          router.replace('/messages');
        }, 2000);
      } finally {
        setIsRedirecting(false);
      }
    };
    
    redirect();
  }, [userId, getOrCreateDirectConversation, hookError, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {redirectError ? (
        <div className="text-center">
          <div className="text-red-500 mb-4">{redirectError}</div>
          <div className="text-gray-400 text-sm">Redirecting...</div>
        </div>
      ) : isRedirecting ? (
        <>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <div className="mt-4 text-gray-400">Creating conversation...</div>
        </>
      ) : null}
    </div>
  );
}