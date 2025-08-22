import * as React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { errorService } from '@/lib/services/error-service'
import { dataService } from '@/lib/services/data-service'
import { authService, Permission } from '@/lib/services/auth-service'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useDebouncedCallback } from './utils/useDebouncedCallback'
import type {
  LocationKey,
  LOCATION_IDS,
  WolfpackMembership,
  WolfPackMember,
  WolfPackEvent,
  UseWolfPackReturn
} from '@/types/wolfpack-members'

export function useWolfpackMembers(locationKey: LocationKey | null): UseWolfPackReturn {
  const { user } = useAuth()
  const [packMembers, setPackMembers] = React.useState<WolfPackMember[]>([])
  const [activeEvents] = React.useState<WolfPackEvent[]>([])
  const [membership, setMembership] = React.useState<WolfpackMembership | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'reconnecting'>('connected')
  
  const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null)
  const locationId = locationKey ? LOCATION_IDS[locationKey] : null

  // Debounced refresh to prevent excessive updates
  const debouncedRefresh = useDebouncedCallback(async () => {
    await fetchMembers(false)
  }, 1000)

  // Enhanced membership check with error handling and caching
  const checkMembership = React.useCallback(async () => {
    if (!user) {
      setMembership(null)
      setLoading(false)
      return
    }

    try {
      // Check permissions first
      if (!authService.hasPermission('VIEW_WOLFPACK_MEMBERS')) {
        throw errorService.handleBusinessLogicError(
          'checkMembership',
          'Insufficient permissions',
          'You need to be a member to view Wolf Pack information',
          { component: 'WolfpackMembersList', metadata: {conversationid: user.id } }
        )
      }

      // Use Data Service for optimized, cached user lookup
      const membershipData = await dataService.getUser(user.id)

      if (!membershipData) {
        setMembership(null)
        return
      }

      // Check if user is an active wolfpack member
      const isActiveMember = membershipData.is_wolfpack_member && 
                           membershipData.wolfpack_status === 'active'

      if (isActiveMember) {
        const adaptedMembership: WolfpackMembership = {
          id: membershipData.id,
          display_name: membershipData.display_name || membershipData.first_name || membershipData.last_name,
          avatar_url: membershipData.profile_image_url || membershipData.avatar_url,
          location_id: membershipData.location_id,
          wolfpack_status: membershipData.wolfpack_status,
          wolfpack_joined_at: membershipData.wolfpack_joined_at,
          wolfpack_tier: membershipData.wolfpack_tier,
          is_wolfpack_member: membershipData.is_wolfpack_member,
          last_activity: membershipData.last_activity
        }
        setMembership(adaptedMembership)
      } else {
        setMembership(null)
      }

    } catch (err) {
      const appError = errorService.handleUnknownError(
        err as Error,
        {
          component: 'WolfpackMembersList',
          action: 'checkMembership',
         conversationid: user?.id
        }
      )
      
      setError(appError.userMessage)
      setMembership(null)
      console.error('Membership check failed:', appError)
    }
  }, [user])

  // Enhanced join pack with comprehensive validation and error handling
  const joinPack = async (profileData?: Partial<{
    display_name: string
  }>) => {
    if (!user || !locationId) {
      const error = errorService.handleValidationError(
        'userOrLocation',
        { user: !!user, locationId: !!locationId },
        'User authentication or location required',
        { component: 'WolfpackMembersList' }
      )
      return { error: error.userMessage }
    }

    // Check join permission
    if (!authService.hasPermission(Permission.JOIN_WOLFPACK)) {
      const permissionError = errorService.handleBusinessLogicError(
        'joinPack',
        'Insufficient permissions',
        'You need to be a verified member to join the Wolf Pack',
        { component: 'WolfpackMembersList',conversationid: user.id }
      )
      return { error: permissionError.userMessage }
    }

    try {
      // Validate display name if provided
      if (profileData?.display_name) {
        const displayName = profileData.display_name.trim()
        if (displayName.length < 2 || displayName.length > 50) {
          throw errorService.handleValidationError(
            'display_name',
            displayName,
            'Display name must be 2-50 characters',
            { component: 'WolfpackMembersList' }
          )
        }
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        is_wolfpack_member: true,
        wolfpack_status: 'active',
        wolfpack_joined_at: new Date().toISOString(),
        location_id: locationId,
        last_activity: new Date().toISOString()
      }

      // Add profile data if provided
      if (profileData?.display_name) {
        updateData.display_name = profileData.display_name.trim()
      }

      // Use Data Service for the update
      const updatedUser = await dataService.updateUser(user.id, updateData)

      // Success feedback
      toast.success('Welcome to the Wolf Pack!')
      
      // Refresh membership and invalidate caches
      await checkMembership()
      dataService.invalidateCachePattern('wolf-pack-members_')
      
      return { data: updatedUser as WolfPackMember }
    } catch (err) {
      const appError = errorService.handleUnknownError(
        err as Error,
        {
          component: 'WolfpackMembersList',
          action: 'joinPack',
         conversationid: user.id,
          metadata: { locationKey }
        }
      )
      
      toast.error(appError.userMessage)
      return { error: appError.userMessage }
    }
  }

  // Enhanced leave pack with proper cleanup
  const leavePack = async () => {
    if (!user) return

    // Check if user can leave (business logic)
    if (!authService.hasPermission(Permission.EDIT_PROFILE)) {
      const permissionError = errorService.handleBusinessLogicError(
        'leavePack',
        'Insufficient permissions',
        'You cannot leave the Wolf Pack at this time',
        { component: 'WolfpackMembersList',conversationid: user.id }
      )
      toast.error(permissionError.userMessage)
      return
    }

    try {
      // Use Data Service for the update
      await dataService.updateUser(user.id, {
        wolfpack_status: 'inactive',
        is_wolfpack_member: false,
        wolfpack_joined_at: null,
        location_id: null
      })

      // Success feedback and cleanup
      toast.info('You have left the Wolf Pack')
      setMembership(null)
      setPackMembers([])
      
      // Invalidate caches
      dataService.invalidateCachePattern('wolf-pack-members_')
      dataService.invalidateCache(`user_${user.id}`)

    } catch (err) {
      const appError = errorService.handleUnknownError(
        err as Error,
        {
          component: 'WolfpackMembersList',
          action: 'leavePack',
         conversationid: user.id
        }
      )
      
      setError(appError.userMessage)
      toast.error(appError.userMessage)
    }
  }

  // Manual refresh with loading state
  const refreshMembership = React.useCallback(async () => {
    setLoading(true)
    await checkMembership()
    await fetchMembers(false)
    setLoading(false)
  }, [checkMembership])

  // Optimized member fetching with Data Service
  const fetchMembers = React.useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      // Use Data Service for optimized, cached member fetching
      const members = await dataService.getWolfpackMembers(locationKey || undefined)

      // Transform data to WolfPackMember format with error handling
      const transformedMembers: WolfPackMember[] = members.map(member => {
        try {
          return {
            id: member.id,
            display_name: member.display_name || member.first_name || member.last_name || 'Pack Member',
            avatar_url: member.avatar_url,
            profile_image_url: member.profile_image_url,
            role: member.role,
            wolfpack_status: member.wolfpack_status,
            wolfpack_tier: member.wolfpack_tier,
            is_online: member.is_online,
            last_activity: member.last_activity,
            wolfpack_joined_at: member.wolfpack_joined_at,
            location_id: member.location_id
          }
        } catch (transformError) {
          errorService.handleUnknownError(
            transformError as Error,
            { 
              component: 'WolfpackMembersList',
              action: 'transformMember',
              metadata: { memberId: member.id } 
            }
          )
          return null
        }
      }).filter(Boolean) as WolfPackMember[]

      setPackMembers(transformedMembers)
      setConnectionStatus('connected')

    } catch (err) {
      const appError = errorService.handleUnknownError(
        err as Error,
        {
          component: 'WolfpackMembersList',
          action: 'fetchMembers',
          metadata: { locationKey }
        }
      )
      
      setError(appError.userMessage)
      setConnectionStatus('disconnected')
      
      // Don't show toast for background refreshes
      if (showLoading) {
        toast.error(appError.userMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [locationKey])

  // Enhanced real-time subscription with error handling and reconnection
  React.useEffect(() => {
    const setupRealtimeSubscription = () => {
      try {
        // Clean up existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }

        const channel = supabase
          .channel('wolf-pack-members_optimized')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: 'is_wolfpack_member=eq.true'
            },
            (payload) => {
              try {
                console.log('Wolfpack member change detected:', payload.eventType)
                
                // Invalidate cache and refresh with debouncing
                dataService.invalidateCachePattern('wolf-pack-members_')
                debouncedRefresh()
                
                setConnectionStatus('connected')
              } catch (error) {
                errorService.handleUnknownError(
                  error as Error,
                  {
                    component: 'WolfpackMembersList',
                    action: 'realtimeUpdate',
                    metadata: { payload: payload.eventType }
                  }
                )
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected')
              console.log('Wolfpack members real-time subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              setConnectionStatus('disconnected')
              console.error('Wolfpack members subscription error')
              
              // Retry after delay
              setTimeout(() => {
                setConnectionStatus('reconnecting')
                setupRealtimeSubscription()
              }, 5000)
            }
          })

        subscriptionRef.current = { unsubscribe: () => channel.unsubscribe() }

      } catch (error) {
        const appError = errorService.handleExternalServiceError(
          'Supabase',
          error as Error,
          {
            component: 'WolfpackMembersList',
            action: 'setupRealtimeSubscription'
          }
        )
        
        setConnectionStatus('disconnected')
        console.error('Failed to setup real-time subscription:', appError)
      }
    }

    setupRealtimeSubscription()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [debouncedRefresh])

  // Initial data loading
  React.useEffect(() => {
    const initializeData = async () => {
      await checkMembership()
      await fetchMembers(true)
    }

    initializeData()
  }, [checkMembership, fetchMembers])

  // Computed values
  const isInPack = !!membership && membership.is_wolfpack_member === true

  return {
    packMembers,
    activeEvents,
    membership,
    isInPack,
    loading,
    error,
    joinPack,
    leavePack,
    refreshMembership,
    connectionStatus
  }
}