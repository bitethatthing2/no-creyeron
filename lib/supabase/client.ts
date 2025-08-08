import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Single instance for browser usage
export const supabase = createClient()

// Alternative function name for consistency
export const getSupabaseBrowserClient = () => supabase

// Error handling utilities
export interface SupabaseError {
  message: string
  status: number
  code?: string
}

export interface PostgrestError extends SupabaseError {
  details?: string
  hint?: string
}

export interface AuthError extends SupabaseError {
  status: number
}

export function handleSupabaseError(error: any): SupabaseError {
  if (error?.message) {
    return {
      message: error.message,
      status: error.status || 500,
      code: error.code
    }
  }
  return {
    message: 'An unknown error occurred',
    status: 500
  }
}
