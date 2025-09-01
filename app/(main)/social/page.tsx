'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WolfpackPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the social feed page
    router.replace('/social/feed');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p>Redirecting to social feed...</p>
      </div>
    </div>
  );
}