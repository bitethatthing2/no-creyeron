'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SocialPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the social feed page
    router.replace('/social/feed');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to social feed...</p>
      </div>
    </div>
  );
}