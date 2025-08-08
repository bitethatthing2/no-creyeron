'use client';

import { forceClearImageCache } from '@/lib/utils/image-cache';

export function CacheClearButton() {
  return (
    <button
      onClick={forceClearImageCache}
      className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      title="Clear image cache and reload"
    >
      🔄 Clear Cache
    </button>
  );
}