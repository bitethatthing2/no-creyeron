import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

/**
 * Get the current session on the server side
 * Use this in server components and API routes
 */
export async function getServerSession() {
  const cookieStore = cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[SERVER AUTH] Error getting session:', {
        message: error.message,
        code: error.status,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[SERVER AUTH] Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'getServerSession'
    });
    return null;
  }
}

/**
 * Get the current user on the server side
 * Use this in server components and API routes
 */
export async function getServerUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * Get user profile with auth verification on server side
 */
export async function getServerUserProfile() {
  const cookieStore = cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError) {
      console.error('[SERVER AUTH] Error fetching user profile:', {
        message: profileError.message,
        code: profileError.code,
        hint: profileError.hint,
        details: profileError.details,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('[SERVER AUTH] Unexpected error fetching profile:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'getServerUserProfile'
    });
    return null;
  }
}

/**
 * Create a Supabase client for server-side operations
 * This includes proper cookie handling for auth
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}