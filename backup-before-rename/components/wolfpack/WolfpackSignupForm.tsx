'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Shield, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import type { Database } from '@/types/database.types'

// Type definitions from your database
type User = Database['public']['Tables']['users']['Row']

// Define the RPC function return type
interface WolfpackJoinResult {
  success: boolean
  message?: string
  tier?: string
}

// Zod schema for profile update form
const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  phone: z.string()
    .regex(/^\+?1?\d{10}$|^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(30).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  instagram_handle: z.string()
    .regex(/^@?[a-zA-Z0-9_.]+$/, 'Invalid Instagram handle')
    .transform(val => val?.startsWith('@') ? val.slice(1) : val)
    .optional()
    .or(z.literal('')),
  favorite_drink: z.string().max(100).optional(),
  vibe_status: z.string().max(100).optional(),
})

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

interface WolfpackSignupFormProps {
  user?: Partial<User>
  onSuccess?: () => void
  onCancel?: () => void
  showProfileFields?: boolean
}

export function WolfpackSignupForm({
  user,
  onSuccess,
  onCancel,
  showProfileFields = true,
}: WolfpackSignupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check current user status
  const checkUserStatus = async () => {
    try {
      setIsCheckingStatus(true)
      setError(null)

      // Get current auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setError('Please log in to join the Wolfpack')
        router.push('/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        setError('Unable to fetch user profile')
        return
      }

      setCurrentUser(userData)

      // Check if already a member
      if (userData.wolfpack_status === 'active') {
        toast.info('You are already a Wolfpack member!')
        router.push('/wolfpack')
        return
      }

    } catch (error) {
      console.error('Error checking status:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  useEffect(() => {
    checkUserStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (data: ProfileUpdateData) => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    if (!currentUser) {
      toast.error('User not found. Please log in again.')
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, update the user profile with the provided information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          display_name: data.display_name || `${data.first_name} ${data.last_name}`,
          bio: data.bio || null,
          instagram_handle: data.instagram_handle || null,
          favorite_drink: data.favorite_drink || null,
          vibe_status: data.vibe_status || 'Ready to party! 🎉',
          notification_preferences: {
            events: true,
            marketing: marketingConsent,
            announcements: true,
            chat_messages: true,
            order_updates: true,
            member_activity: true,
            social_interactions: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)

      if (updateError) {
        throw updateError
      }

      // Call the wolfpack_membership_join function
      const { data: joinResult, error: joinError } = await supabase
        .rpc('wolfpack_membership_join') as { data: WolfpackJoinResult | null, error: Error | null }

      if (joinError) {
        throw joinError
      }

      if (!joinResult?.success) {
        throw new Error(joinResult?.message || 'Failed to join Wolfpack')
      }

      // Track analytics event
      await supabase.from('user_analytics').insert({
        user_id: currentUser.id,
        event_type: 'wolfpack_joined',
        event_data: {
          tier: joinResult.tier || 'basic',
          marketing_consent: marketingConsent,
          has_profile_info: Boolean(data.display_name || data.bio),
        },
      })

      // Success!
      toast.success('Welcome to the Wolfpack! 🐺', {
        description: 'Your membership is now active. Enjoy exclusive benefits!',
      })

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/wolfpack')
      }

    } catch (error) {
      console.error('Wolfpack signup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join Wolfpack'
      setError(errorMessage)
      toast.error('Failed to join Wolfpack', {
        description: errorMessage || 'Please try again or contact support',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isCheckingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error && !currentUser) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Already a member
  if (currentUser?.wolfpack_status === 'active') {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              You&#39;re already a Wolfpack member! 
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={() => router.push('/wolfpack')}
              >
                Go to Wolfpack
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const initialValues: Partial<ProfileUpdateData> = {
    first_name: currentUser?.first_name || user?.first_name || '',
    last_name: currentUser?.last_name || user?.last_name || '',
    phone: currentUser?.phone || user?.phone || '',
    display_name: currentUser?.display_name || user?.display_name || '',
    bio: currentUser?.bio || user?.bio || '',
    instagram_handle: currentUser?.instagram_handle || user?.instagram_handle || '',
    favorite_drink: currentUser?.favorite_drink || user?.favorite_drink || '',
    vibe_status: currentUser?.vibe_status || user?.vibe_status || 'Ready to party! 🎉',
  }

  const labels = {
    first_name: {
      label: 'First Name',
      placeholder: 'Enter your first name',
    },
    last_name: {
      label: 'Last Name',
      placeholder: 'Enter your last name',
    },
    phone: {
      label: 'Phone Number (Optional)',
      placeholder: '(555) 123-4567',
      description: 'For exclusive SMS updates and offers',
    },
    display_name: {
      label: 'Display Name (Optional)',
      placeholder: 'How you want to appear in the pack',
      description: 'This is how other members will see you',
    },
    bio: {
      label: 'About You (Optional)',
      placeholder: 'Tell us about yourself...',
      description: 'Share a bit about yourself with the pack',
    },
    instagram_handle: {
      label: 'Instagram (Optional)',
      placeholder: '@your_handle',
      description: 'Connect with other pack members',
    },
    favorite_drink: {
      label: 'Favorite Drink (Optional)',
      placeholder: "What's your go-to drink?",
    },
    vibe_status: {
      label: 'Your Vibe (Optional)',
      placeholder: "What's your current mood?",
    },
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Join the Wolfpack
        </CardTitle>
        <CardDescription>
          Become part of an exclusive community with amazing benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits Section */}
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="font-semibold mb-3">Wolfpack Benefits:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Instant bar tab access at participating locations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Location-based menu ordering and exclusive deals</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Access to exclusive Wolfpack chat and social features</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Member-only events, parties, and special offers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Priority support and VIP treatment</span>
            </li>
          </ul>
        </div>

        {/* Profile Form */}
        {showProfileFields && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Information</h3>
            <DynamicForm
              schema={profileUpdateSchema}
              initialValues={initialValues}
              labels={labels}
              onSubmitAction={handleSubmit}
              isLoading={isLoading}
              renderBeforeSubmit={() => (
                <div className="space-y-4">
                  {/* Terms Checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        You agree to our{' '}
                        <Button variant="link" className="h-auto p-0 text-sm">
                          Terms of Service
                        </Button>{' '}
                        and{' '}
                        <Button variant="link" className="h-auto p-0 text-sm">
                          Privacy Policy
                        </Button>
                      </p>
                    </div>
                  </div>

                  {/* Marketing Checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="marketing"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(!!checked)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="marketing"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Send me exclusive offers and updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about special events, new features, and member-only deals
                      </p>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              submitButtonText={isLoading ? 'Joining...' : 'Join the Wolfpack'}
              onCancelAction={onCancel}
            />
          </div>
        )}

        {/* Simple join without profile update */}
        {!showProfileFields && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="simple-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="simple-terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the Wolfpack terms and conditions
                </Label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => handleSubmit({
                  first_name: currentUser?.first_name || 'Pack',
                  last_name: currentUser?.last_name || 'Member',
                })}
                disabled={isLoading || !agreedToTerms}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Join the Wolfpack
                  </>
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}