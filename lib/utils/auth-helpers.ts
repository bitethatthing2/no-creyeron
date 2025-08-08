import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the app user ID from the current authenticated user
 * Maps from auth.users.id to public.users.id
 * 
 * ⚠️ IMPORTANT: Always use this function instead of user.auth_id || user.id pattern
 * The audit report specifically warns against that pattern.
 */
export async function getAppUserId(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();
  
  if (error) {
    console.error('Error mapping auth user to app user:', error);
    throw new Error('User mapping failed');
  }
  
  return data.id;
}

/**
 * Get app user with full details from the current authenticated user
 */
export async function getAppUser(supabase: SupabaseClient) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: appUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (error) {
      console.error('Error getting app user:', error);
      return null;
    }

    return appUser;
  } catch (error) {
    console.error('Unexpected error getting app user:', error);
    return null;
  }
}