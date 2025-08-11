import { supabase } from '@/lib/supabase';

export async function checkUserSessionStatus(email?: string) {
  try {
    const { data, error } = await supabase.rpc('check_user_session_status', {
      email: email
    });

    if (error) {
      console.error('Error checking session status:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in checkUserSessionStatus:', error);
    return { success: false, error };
  }
}

export async function getCurrentAuthUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Error getting current auth user:', error);
    return { user: null, error };
  }
}

export async function isUserLoggedIn() {
  const { user, error } = await getCurrentAuthUser();
  return {
    isLoggedIn: !!user && !error,
    user,
    error
  };
}

export async function performCompleteLogout() {
  try {
    await supabase.rpc('handle_user_logout');
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    localStorage.removeItem('user_profile');
    localStorage.removeItem('fcm_token');
    sessionStorage.clear();
    
    return { success: true };
  } catch (error) {
    console.error('Complete logout failed:', error);
    return { success: false, error };
  }
}