'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WolfpackProfileManager } from '@/components/wolfpack/WolfpackProfileManager';

export default function EditProfilePage() {
  const router = useRouter();

  return (
    <div className="main-content">
      <div className="container mx-auto px-4 py-3 sm:py-4 max-w-4xl">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Profile</h1>
        </div>
        
        <WolfpackProfileManager />
      </div>
    </div>
  );
}