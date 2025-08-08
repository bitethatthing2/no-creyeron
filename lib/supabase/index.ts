/**
 * Centralized Supabase Client Management
 * 
 * This is the SINGLE entry point for all Supabase client access.
 * DO NOT import from ./client or ./server directly.
 * 
 * Usage:
 * - Browser: import { supabase } from '@/lib/supabase'
 * - Server Components: import { createServerClient } from '@/lib/supabase/server'
 * - Admin Operations: import { createAdminClient } from '@/lib/supabase/server'
 */

// Re-export client functions with proper types
export { 
  createClient,
  supabase,
  getSupabaseBrowserClient,
  handleSupabaseError,
  type SupabaseError,
  type PostgrestError,
  type AuthError
} from './client';

// Server functions are only exported when used in server context
// Import directly from '@/lib/supabase/server' for server components
// This prevents Next.js errors about importing server-only components in client code

// Export types
export type { Database } from '@/types/database.types';

// Development logging (without monkey patching)
if (process.env.NODE_ENV === 'development') {
  console.log('[Supabase] Using centralized client management');
}

/**
 * Best Practices:
 * 
 * 1. Browser/Client Components:
 *    import { supabase } from '@/lib/supabase'
 * 
 * 2. Server Components/Route Handlers:
 *    import { createServerClient } from '@/lib/supabase'
 *    const supabase = await createServerClient()
 * 
 * 3. Admin Operations (with service role):
 *    import { createAdminClient } from '@/lib/supabase'
 *    const supabase = createAdminClient()
 * 
 * 4. Error Handling:
 *    import { handleSupabaseError } from '@/lib/supabase'
 *    catch (error) {
 *      const { message, status } = handleSupabaseError(error)
 *    }
 */