// Authentication debugging utilities
import { supabase } from '@/lib/supabase';
export interface AuthDebugInfo {
  supabaseConnection: boolean;
  environmentVars: boolean;
  userExists: boolean | null;
  emailConfirmed: boolean | null;
  error: string | null;
}

export async function debugAuthenticationIssue(email: string): Promise<AuthDebugInfo> {  const debugInfo: AuthDebugInfo = {
    supabaseConnection: false,
    environmentVars: false,
    userExists: null,
    emailConfirmed: null,
    error: null
  };

  try {
    // 1. Check environment variables
    debugInfo.environmentVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!debugInfo.environmentVars) {
      debugInfo.error = 'Missing Supabase environment variables';
      return debugInfo;
    }

    // 2. Test Supabase connection
    try {
      const { error: connectionError } = await supabase.from('users').select('count').limit(1);
      debugInfo.supabaseConnection = !connectionError;
      
      if (connectionError) {
        debugInfo.error = `Supabase connection error: ${connectionError.message}`;
        return debugInfo;
      }
    } catch (err) {
      debugInfo.error = `Supabase connection failed: ${err}`;
      return debugInfo;
    }

    // 3. Check if user exists in auth.users (requires service role, so this might fail)
    try {
      // This is a basic check - in production, you'd need server-side verification
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session:', sessionData);
    } catch (err) {
      console.warn('Session check failed:', err);
    }

    return debugInfo;
  } catch (error) {
    debugInfo.error = `Debug check failed: ${error}`;
    return debugInfo;
  }
}

interface AuthError {
  message?: string;
  code?: string | number;
  status?: number;
  details?: string;
  hint?: string;
}

export function logAuthError(error: AuthError | Error | unknown, context: string) {
  console.group(`🔐 Auth Error - ${context}`);
  console.error('Error details:', error);
  
  if (error && typeof error === 'object') {
    const authError = error as AuthError;
    console.log('Error message:', authError.message);
    console.log('Error code:', authError.code || authError.status);
    console.log('Timestamp:', new Date().toISOString());
    
    // Log additional Supabase-specific info
    if (authError.details) {
      console.log('Error details:', authError.details);
    }
    if (authError.hint) {
      console.log('Error hint:', authError.hint);
    }
  }
  
  console.groupEnd();
}

export function getAuthErrorSuggestions(errorMessage: string): string[] {
  const suggestions: string[] = [];
  
  if (errorMessage.includes('Invalid login credentials')) {
    suggestions.push('Double-check your email address and password');
    suggestions.push('Try signing up if you haven\'t created an account yet');
    suggestions.push('Use the "Forgot Password" feature if available');
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    suggestions.push('Check your email inbox for a confirmation email');
    suggestions.push('Check your spam/junk folder');
    suggestions.push('Request a new confirmation email');
  }
  
  if (errorMessage.includes('Too many requests')) {
    suggestions.push('Wait 5-10 minutes before trying again');
    suggestions.push('Clear your browser cache and cookies');
  }
  
  if (errorMessage.includes('Database') || errorMessage.includes('connection')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try refreshing the page');
    suggestions.push('Contact support if the issue persists');
  }
  
  if (errorMessage.includes('signup disabled')) {
    suggestions.push('Contact support to enable your account');
    suggestions.push('Check if registration is temporarily disabled');
  }
  
  return suggestions;
}

interface TestResult {
  success: boolean;
  error?: string;
}

interface SessionTestResult extends TestResult {
  hasSession?: boolean;
}

interface AuthTestDetails {
  environmentCheck: {
    url: boolean;
    anonKey: boolean;
    urlValue?: string;
  };
  connectionTest: TestResult | null;
  sessionTest: SessionTestResult | null;
}

export async function testSupabaseAuth(): Promise<{success: boolean, details: AuthTestDetails | { error: string }}> {  try {
    const tests: AuthTestDetails = {
      environmentCheck: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
      },
      connectionTest: null,
      sessionTest: null
    };
    
    // Test basic connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      tests.connectionTest = { success: !error, error: error?.message };
    } catch (err) {
      tests.connectionTest = { success: false, error: String(err) };
    }
    
    // Test session handling
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      tests.sessionTest = { 
        success: !sessionError, 
        hasSession: !!sessionData.session,
        error: sessionError?.message 
      };
    } catch (err) {
      tests.sessionTest = { success: false, error: String(err) };
    }
    
    return { success: true, details: tests };
  } catch (error) {
    return { success: false, details: { error: String(error) } };
  }
}
