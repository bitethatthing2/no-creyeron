/**
 * Main Types Export Index
 * Consolidated exports for all application types
 */

// Re-export database types
export type { Database, Tables, TablesInsert, TablesUpdate, Json } from './supabase'

// Re-export all chat/messaging types
export * from './chat'

// Re-export app-level types
export * from './app'

// Type aliases for backwards compatibility and cleaner imports
export type {
  // Core database entities
  ChatMessage as Message,
  ChatConversation as Conversation,
  ChatParticipant as Participant,
  ChatMessageReaction as MessageReaction,
  ChatMessageReceipt as MessageReceipt,
  User,
  
  // Extended types with relationships
  MessageWithSender,
  ConversationWithParticipants,
  ParticipantWithUser,
  
  // Enums
  MessageType,
  MediaType,
  ConversationType, 
  ParticipantRole,
  
  // Hook return type (imported from /lib/hooks/useMessaging.ts)
  // UseMessagingReturn,
  
  // Component props
  ChatInputProps,
  MessageItemProps,
  ConversationListProps,
  MessageListProps,
  
  // API types
  ApiResponse,
  SendMessageResponse,
  GetOrCreateDMResponse,
  GetConversationMessagesResponse,
  
  // Input types
  CreateMessageInput,
  CreateConversationInput,
  SendMessageParams,
  GetConversationMessagesParams,
  GetOrCreateDMParams,
  
  // Filter types
  ConversationFilters,
  MessageFilters,
  MessageLoadOptions,
  ConversationLoadOptions,
  
  // UI state types
  MessageInputState,
  ConversationListState,
  MessageListState,
  
  // Utility types
  TypingIndicator,
  ReadReceipt,
  MessageValidation,
  RateLimit,
  ReactionEmoji,
  
  // Real-time types
  RealtimeMessagePayload,
  RealtimeConversationPayload,
  RealtimeReactionPayload,
} from './chat'

// Common type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type NullableFields<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | null }

// Utility types for API responses
export type SuccessResponse<T> = {
  success: true
  data: T
  error?: never
}

export type ErrorResponse = {
  success: false
  data?: never
  error: string
  code?: string
}

export type Response<T> = SuccessResponse<T> | ErrorResponse

// Pagination types
export interface PaginationParams {
  limit?: number
  offset?: number
  cursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total_count?: number
  has_more: boolean
  next_cursor?: string | null
}

// Search types
export interface SearchParams {
  query: string
  filters?: Record<string, any>
  sort?: string
  limit?: number
}

export interface SearchResponse<T> {
  results: T[]
  total_matches: number
  query: string
  took_ms?: number
}