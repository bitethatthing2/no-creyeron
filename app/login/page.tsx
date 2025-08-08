'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAuthError, getAuthErrorSuggestions, testSupabaseAuth } from '@/lib/auth/debug';

export default function UnifiedLoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Diagnostic function to test Supabase connectivity
  const testSupabaseConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      console.log('Supabase connection test:', { data, error });
      return !error;
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      return false;
    }
  };

  // Enhanced validation function
  const validateSignInData = (email: string, password: string): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate input data
    const validationError = validateSignInData(email, password);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up flow
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        console.log('Attempting sign up with email:', email);
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              display_name: displayName,
              full_name: displayName,
            },
          },
        });

        if (error) {
          console.error('Sign up error:', error.message);
          setError(error.message);
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          console.log('Sign up successful - user profile will be created automatically by database trigger');
          
          // Small delay to allow trigger to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          toast({
            title: "Sign Up Successful", 
            description: "Welcome! Please check your email to verify your account.",
          });
          
          // Redirect to wolfpack feed after successful signup
          router.push('/wolfpack/feed');
          return;
        }
      } else {
        // Sign in flow
        console.log('Attempting sign in with email:', email);
        
        let data, error;
        try {
          const response = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          data = response.data;
          error = response.error;
          console.log('Sign in response received:', { data: !!data, error: !!error });
        } catch (authException) {
          console.error('Sign in exception caught:', authException);
          setError('Authentication service unavailable. Please try again.');
          setIsLoading(false);
          return;
        }
        
        if (error) {
          console.error('Sign in error details:', error);
          // Use enhanced error logging
          logAuthError(error, 'Sign In');
          
          let errorMessage = error.message;
          
          // Handle specific authentication errors with better user guidance
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please double-check your credentials and try again.';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
            
            // Run diagnostic tests when credentials are invalid
            try {
              const [authResult, connectionResult] = await Promise.all([
                testSupabaseAuth(),
                testSupabaseConnection()
              ]);
              
              console.log('🔍 Auth diagnostic test results:', authResult);
              console.log('🔍 Connection test results:', connectionResult);
              
              if (!authResult.success) {
                console.error('🚨 Supabase auth issues detected');
              }
              if (!connectionResult) {
                console.error('🚨 Supabase connection issues detected');
              }
            } catch (diagnosticError) {
              console.error('Diagnostic tests failed:', diagnosticError);
            }
            
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and confirm your account before signing in. Check your spam folder if needed.';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'No account found with this email. Please sign up first or check your email address.';
          } else if (error.message.includes('Database error') || error.message.includes('schema')) {
            errorMessage = 'Database connection issue. Please contact support if this persists.';
            
            // Test connection when database errors occur
            testSupabaseConnection().then(result => {
              if (!result) {
                console.error('🚨 Database connection confirmed to be failing');
              }
            });
            
          } else if (error.message.includes('signup disabled')) {
            errorMessage = 'New user registration is currently disabled. Please contact support.';
          }
          
          // Get helpful suggestions for the user
          const suggestions = getAuthErrorSuggestions(errorMessage);
          if (suggestions.length > 0) {
            console.log('💡 Suggestions for user:', suggestions);
          }
          
          setError(errorMessage);
          toast({
            title: "Sign In Failed",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          console.log('Sign in successful for user:', data.user.email);
          
          toast({
            title: "Sign In Successful",
            description: "Welcome back!",
          });
          
          // Check if user is admin and redirect immediately
          const isAdmin = data.user.email === 'gthabarber1@gmail.com' || 
                          data.user.app_metadata?.role === 'admin';
          
          // Wait a moment for session to be fully persisted before redirecting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Redirect after ensuring session is saved
          if (isAdmin) {
            console.log('🔄 Redirecting admin to /admin/dashboard');
            router.push('/admin/dashboard');
          } else {
            // Check multiple sources for redirect URL
            const urlReturnUrl = new URLSearchParams(window.location.search).get('returnUrl');
            const localStorageReturnUrl = localStorage.getItem('redirectAfterLogin');
            
            // Clear the localStorage redirect after using it
            if (localStorageReturnUrl) {
              localStorage.removeItem('redirectAfterLogin');
            }
            
            const targetUrl = urlReturnUrl || localStorageReturnUrl || '/wolfpack/feed';
            console.log('🔄 Redirecting user to:', targetUrl);
            router.push(targetUrl);
          }
          
          // Do profile operations in background (non-blocking)
          setTimeout(async () => {
            try {
              const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', data.user.id)
                .maybeSingle();

              if (profileError) {
                console.error('Error checking user profile:', profileError);
                // Continue with sign in even if profile check fails
              } else if (!userProfile) {
                console.log('User profile not found, creating one...');
                // Create profile for users who signed up before the trigger was fixed
                const displayName = data.user.user_metadata?.display_name || 
                                  data.user.user_metadata?.full_name || 
                                  data.user.email?.split('@')[0] || 
                                  'User';
                
                const { error: createError } = await supabase
                  .from('users')
                  .insert({
                    auth_id: data.user.id,
                    email: data.user.email || '',
                    first_name: displayName.split(' ')[0] || '',
                    last_name: displayName.split(' ').slice(1).join(' ') || '',
                    display_name: displayName,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });

                if (createError) {
                  console.error('Error creating user profile:', createError);
                  // Don't fail sign in if profile creation fails
                } else {
                  console.log('User profile created successfully during sign in');
                }
              } else {
                console.log('User profile found:', userProfile.display_name);
              }
            } catch (profileErr) {
              console.error('Profile check exception:', profileErr);
              // Continue with sign in even if profile operations fail
            }
          }, 100); // Small delay to ensure redirect happens first
          
          return;
        }
      }
    } catch (err) {
      console.error('Authentication error during login:', err);
      console.error('Full error details:', JSON.stringify(err, null, 2));
      setError('An unexpected error occurred');
      toast({
        title: "Authentication Error",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black p-4 pb-20 relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/5 via-black to-zinc-900/10" />
      
      <div className="relative w-full max-w-md bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50">
        {/* Logo or brand icon */}
        <div className="flex justify-center pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-2xl font-bold text-white">SH</span>
          </div>
        </div>
        
        <div className="p-8 space-y-1">
          <h1 className="text-2xl font-bold text-center text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-zinc-400 text-center">
            {isSignUp 
              ? 'Join the Side Hustle Bar community'
              : 'Sign in to your account to continue'
            }
          </p>
        </div>
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-zinc-300">Display Name</label>
                <input 
                  id="displayName"
                  type="text" 
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email</label>
              <input 
                id="email"
                type="email" 
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full px-3 py-2 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                className="ml-1 text-orange-400 hover:text-orange-300 font-medium transition-colors"
                onClick={toggleMode}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}