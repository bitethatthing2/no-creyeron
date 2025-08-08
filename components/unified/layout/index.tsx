'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Export client components with dynamic imports
export const Header = dynamic(() => import('./Header'), {
  loading: () => (
    <div className="h-16 border-b animate-pulse bg-muted/20"></div>
  ),
  ssr: false
});
