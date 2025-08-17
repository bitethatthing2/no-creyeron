// lib/services/user-data.service.ts
import { createServerClient } from '@/lib/supabase/server';

/**
 * Helper function to get database user ID from auth user ID
 * @param authId - The Supabase auth user ID
 * @returns The database user ID or null if not found
 */
export async function getUserId(authId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.id;
}