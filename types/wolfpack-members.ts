import type { Database } from '@/types/database.types'

// Location IDs from database
export const LOCATION_IDS = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const

export type LocationKey = keyof typeof LOCATION_IDS

// Use correct database types
type UserRow = Database['public']['Tables']['users']['Row']
type DjEventRow = Database['public']['Tables']['dj_events']['Row']
type LocationRow = Database['public']['Tables']['locations']['Row']

// Optimized membership type with better error handling
export interface WolfpackMembership {
  id: string
  display_name: string | null
  avatar_url: string | null
  location_id: string | null
  wolfpack_status: string | null
  wolfpack_joined_at: string | null
  wolfpack_tier: string | null
  is_wolfpack_member: boolean | null
  last_activity: string | null
}

// Enhanced pack member interface
export interface WolfPackMember {
  id: string
  display_name: string
  avatar_url: string | null
  profile_image_url: string | null
  role: string | null
  wolfpack_status: string | null
  wolfpack_tier: string | null
  is_online: boolean | null
  last_activity: string | null
  wolfpack_joined_at: string | null
  location_id: string | null
}

// Event interface with participant count
export interface WolfPackEvent extends DjEventRow {
  participant_count?: number
}

// Location interface with member count
export interface WolfPackLocation extends LocationRow {
  member_count?: number
}

export interface UseWolfPackReturn {
  packMembers: WolfPackMember[]
  activeEvents: WolfPackEvent[]
  membership: WolfpackMembership | null
  isInPack: boolean
  loading: boolean
  error: string | null
  joinPack: (profileData?: Partial<{
    display_name: string
  }>) => Promise<{ data?: WolfPackMember; error?: string }>
  leavePack: () => Promise<void>
  refreshMembership: () => Promise<void>
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
}