'use client';

import { useState } from 'react';
import { cleanupAndResetAuth } from '@/lib/utils/cookie-utils';
import { supabase } from '@/lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function AuthFixButton() {
  const [isFixing, setIsFixing] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Only show in development or if there's an auth issue
  if (process.env.NODE_ENV === 'production' && !showButton) {
    return null;
  }

  const handleFix = async () => {
    setIsFixing(true);
    try {
      await cleanupAndResetAuth(supabase);
    } catch (error) {
      console.error('Error fixing auth:', error);
      // Even if there's an error, try to reload
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleFix}
      disabled={isFixing}
      className="fixed bottom-20 right-4 z-50 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
      title="Fix authentication issues"
    >
      {isFixing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Fixing...</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Fix Auth Issues</span>
        </>
      )}
    </button>
  );
}