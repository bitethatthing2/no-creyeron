// DJ Dashboard Schema Types - Generated from actual database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ===== Core DJ Tables =====

export interface DJBroadcast {
  id: string
  dj_id: string | null
  location_id: string | null
  message: string
  broadcast_type: BroadcastType | null
  created_at: string | null
  session_id: string | null
  title: string
  subtitle: string | null
  background_color: string | null
  text_color: string | null
  accent_color: string | null
  animation_type: string | null
  emoji_burst: string[] | null
  interaction_config: InteractionConfig | null
  duration_seconds: number | null
  auto_close: boolean | null
  priority: BroadcastPriority | null
  status: BroadcastStatus | null
  sent_at: string | null
  expires_at: string | null
  closed_at: string | null
  view_count: number | null
  interaction_count: number | null
  unique_participants: number | null
  tags: string[] | null
  category: string | null
  updated_at: string | null
}

export interface DJDashboardState {
  id: string
  dj_id: string | null
  is_live: boolean | null
  current_broadcast_id: string | null
  current_energy_level: number | null
  current_crowd_size: number | null
  active_participants: string[] | null
  broadcast_queue: Json | null
  auto_queue_enabled: boolean | null
  dashboard_config: Json | null
  updated_at: string | null
}

export interface DJBroadcastResponse {
  id: string
  broadcast_id: string | null
  user_id: string | null
  response_type: ResponseType
  option_id: string | null
  text_response: string | null
  emoji: string | null
  media_url: string | null
  responded_at: string | null
  device_type: string | null
  is_anonymous: boolean | null
  response_metadata: Json | null
  is_featured: boolean | null
  is_hidden: boolean | null
  moderation_status: string | null
}

// ===== Views =====

export interface ActiveBroadcastLive {
  id: string
  dj_id: string | null
  location_id: string | null
  message: string
  broadcast_type: string | null
  created_at: string | null
  session_id: string | null
  title: string
  subtitle: string | null
  background_color: string | null
  text_color: string | null
  accent_color: string | null
  animation_type: string | null
  emoji_burst: string[] | null
  interaction_config: Json | null
  duration_seconds: number | null
  auto_close: boolean | null
  priority: string | null
  status: string | null
  sent_at: string | null
  expires_at: string | null
  closed_at: string | null
  view_count: number | null
  interaction_count: number | null
  unique_participants: number | null
  tags: string[] | null
  category: string | null
  updated_at: string | null
  seconds_remaining: number | null
  dj_name: string | null
  dj_avatar: string | null
}

// ===== Enums and Types =====

export type BroadcastType = 
  | 'general'
  | 'shout_out'
  | 'poll'
  | 'quick_response'
  | 'song_request'
  | 'contest'
  | 'spotlight'
  | 'vibe_check'
  | 'custom'

export type BroadcastPriority = 'low' | 'normal' | 'high' | 'urgent'

export type BroadcastStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'expired'

export type ResponseType = 'multiple_choice' | 'text' | 'emoji' | 'media'

export type AnimationType = 'bounce' | 'slide' | 'fade' | 'zoom' | 'pulse' | 'shake'

// ===== Interaction Config =====

export interface InteractionConfig {
  response_type: ResponseType
  options?: BroadcastOption[]
  allow_multiple?: boolean
  show_results_live?: boolean
  anonymous_responses?: boolean
  show_responders?: boolean
  highlight_responders?: boolean
  responder_display?: 'avatar_only' | 'name_only' | 'avatar_with_name'
  animation_on_select?: string
  show_timer?: boolean
  countdown_seconds?: number
  max_responses?: number
  voting_ends_at?: string
}

export interface BroadcastOption {
  id: string
  text: string
  emoji?: string
  color?: string
  metadata?: Json
}

// ===== Analytics Types =====

export interface BroadcastAnalytics {
  timeframe: string
  start_date: string
  broadcasts: number
  broadcast_types_used: number
  avg_interactions: number
  max_participants: number
  total_responses: number
  unique_responders: number
  avg_response_time_seconds: number
  broadcasts_by_type: Record<string, number>
  top_broadcasts: Array<{
    title: string
    type: string
    responses: number
    participants: number
  }>
}

export interface WolfpackLiveStats {
  total_active: number
  very_active: number
  gender_breakdown: Record<string, number>
  recent_interactions: {
    total_interactions: number
    active_participants: number
  }
  energy_level: number
  top_vibers: Array<{
    user_id: string
    name: string
    avatar: string | null
    vibe: string | null
  }>
}

// ===== RPC Function Parameters =====

export interface GetWolfpackLiveStatsParams {
  p_location_id: string
}

export interface GetDJDashboardAnalyticsParams {
  p_dj_id: string
  p_timeframe: 'today' | 'week' | 'month' | 'all_time'
}

export interface SendBroadcastNotificationParams {
  p_broadcast_id: string
}

export interface QuickVibeCheckParams {
  p_dj_id: string
  p_location_id: string
}

export interface SingleLadiesSpotlightParams {
  p_dj_id: string
  p_location_id: string
  p_custom_message?: string | null
}

// ===== Location Config =====

export const LOCATION_CONFIG = {
  salem: {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    name: 'Salem',
    displayName: 'THE SIDEHUSTLE BAR Salem'
  },
  portland: {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    name: 'Portland',
    displayName: 'THE SIDEHUSTLE BAR Portland'
  }
} as const

export type LocationKey = keyof typeof LOCATION_CONFIG

// ===== Component Props =====

export interface DJDashboardProps {
  location?: LocationKey
}

export interface BroadcastFormProps {
  djId: string
  locationId: string
  sessionId?: string
  onBroadcastCreated?: (broadcast: DJBroadcast) => void
}

export interface EventCreatorProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: (broadcast: DJBroadcast) => void
  availableMembers: Member[]
  location: LocationKey
}

export interface MassMessageInterfaceProps {
  isOpen: boolean
  onClose: () => void
  packMemberCount: number
  location: LocationKey
}

export interface Member {
  id: string
  displayName: string
  profilePicture?: string
}

// ===== UI Component Props =====

export interface StatCardProps {
  value: number | string
  label: string
  subLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export interface ActionButtonProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}

export interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full'
}

// ===== Event Templates =====

export interface EventTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  broadcastType: BroadcastType
  defaultDuration: number
  suggestedContestants: number
  defaultOptions?: BroadcastOption[]
}

export interface MessageTemplate {
  id: string
  title: string
  content: string
  type: BroadcastType
  priority: BroadcastPriority
  icon: React.ComponentType<{ className?: string }>
  duration: number
  emoji_burst?: string[]
}

// ===== Form Data Types =====

export interface BroadcastFormData {
  title: string
  message: string
  subtitle?: string
  broadcast_type: BroadcastType
  priority: BroadcastPriority
  duration_seconds: number
  background_color: string
  text_color: string
  accent_color: string
  animation_type: AnimationType
  emoji_burst?: string[]
  interaction_config: InteractionConfig
  tags?: string[]
  category?: string
}

export interface EventFormData {
  title: string
  description?: string
  event_type?: string
  duration_seconds?: number
  options?: BroadcastOption[]
}