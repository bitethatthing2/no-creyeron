// Central export point for all database types
export * from './database-models';
export * from './features/wolfpack-interfaces';

// Re-export specific database types for convenience
export type {
  User,
  UserProfile,
  WolfpackMembership,
  UserLocation,
  UserActivityStatus,
  WolfpackVideo,
  WolfpackPost,
  WolfpackComment,
  WolfpackReaction,
  WolfpackFollow,
  WolfpackSavedPost,
  WolfpackConversation,
  WolfpackMessage,
  UserWithProfile,
  WolfpackContent,
  FeedItem,
  EnrichedWolfpackVideo,
  EnrichedWolfpackPost,
  // Update types
  UserUpdate,
  UserProfileUpdate,
  WolfpackMembershipUpdate,
  UserLocationUpdate,
  UserActivityStatusUpdate,
  WolfpackVideoUpdate,
  WolfpackPostUpdate,
  WolfpackCommentUpdate,
  // Insert types
  UserInsert,
  UserProfileInsert,
  WolfpackMembershipInsert,
  UserLocationInsert,
  UserActivityStatusInsert,
  WolfpackVideoInsert,
  WolfpackPostInsert,
  WolfpackCommentInsert,
  WolfpackReactionInsert,
  WolfpackFollowInsert,
  WolfpackSavedPostInsert,
  WolfpackConversationInsert,
  WolfpackMessageInsert
} from './database-models';

// Re-export interface types
export type {
  WolfpackAccess,
  WolfpackFeatureFlags,
  WolfpackPermissions,
  WolfpackStatusType
} from './features/wolfpack-interfaces';

// Re-export Database type
export type { Database } from './database.types';