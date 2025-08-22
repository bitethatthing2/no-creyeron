/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr'
import type { } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Lazy initialization for browser usage to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createClient()
    }
    return (_supabase as any)[prop]
  }
})

// Alternative function name for consistency
export const getSupabaseBrowserClient = () => {
  if (!_supabase) {
    _supabase = createClient()
  }
  return _supabase
}

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
