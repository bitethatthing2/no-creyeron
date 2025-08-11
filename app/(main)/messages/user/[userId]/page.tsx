'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessaging } from '@/lib/hooks/useMessaging';

export default function DirectMessageRedirect() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { getOrCreateDirectConversation } = useMessaging();

  useEffect(() => {
    const redirect = async () => {
      const conversationId = await getOrCreateDirectConversation(userId);
      if (conversationId) {
        router.replace(`/messages/conversation/${conversationId}`);
      } else {
        router.replace('/messages');
      }
    };
    redirect();
  }, [userId, getOrCreateDirectConversation, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
    </div>
  );
}