import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Admin index page - redirects to appropriate location based on auth status
 * This is a server component that handles the redirect logic
 */
export default async function AdminPage() {
  const supabase = await createServerClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not authenticated - redirect to login
    redirect('/login');
  }
  
  // Check if user has admin role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (userData?.role !== 'admin') {
    // Not an admin - redirect to home page
    redirect('/');
  }
  
  // User is authenticated and is an admin - redirect to dashboard
  redirect('/admin/dashboard');
}
