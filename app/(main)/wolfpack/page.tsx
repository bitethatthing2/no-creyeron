'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WolfpackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wolfpack/feed');
  }, [router]);

  return null;
}