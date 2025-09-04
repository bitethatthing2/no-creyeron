import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export interface CleanupResults {
  posts_deleted: number;
  read_messages_deleted: number;
  unread_messages_deleted: number;
  storage_files_deleted: number;
  inactive_tokens_deleted: number;
  old_notifications_deleted: number;
  orphaned_interactions_deleted: number;
  orphaned_comments_deleted: number;
  orphaned_receipts_deleted: number;
}

export interface CleanupResponse {
  success: boolean;
  cleanup_results: CleanupResults;
  cleaned_at: string;
  total_items_cleaned: number;
}

export const useCleanup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const runCleanup = async (): Promise<CleanupResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-scheduler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Cleanup failed' }));
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Admin access required');
        } else {
          throw new Error(errorData.error || `Cleanup failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { runCleanup, isLoading, error };
};