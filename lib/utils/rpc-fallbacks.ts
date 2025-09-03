// lib/utils/rpc-utilities.ts
import { supabase } from "@/lib/supabase";

/**
 * RPC Utilities for NEW SIDEHUSTLE Supabase Functions
 * This file provides typed wrappers for all RPC functions in your database
 */

// ============================================================================
// USER & PROFILE FUNCTIONS
// ============================================================================

/**
 * Get the current authenticated user's ID
 */
export async function getCurrentUserId() {
  const { data, error } = await supabase.rpc("get_current_user_id");
  return { data, error };
}

/**
 * Get a user's display name
 */
export async function getDisplayName(userId: string) {
  const { data, error } = await supabase.rpc("get_display_name", {
    p_user_id: userId,
  });
  return { data, error };
}

/**
 * Get user profile information
 */
export async function getUserProfile(targetUserId: string) {
  const { data, error } = await supabase.rpc("get_user_profile", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Get user profile with follower/following counts
 */
export async function getUserProfileWithCounts(targetUserId: string) {
  const { data, error } = await supabase.rpc("get_user_profile_with_counts", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Update user profile
 */
export async function updateUserProfile(params: {
  avatarUrl?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  settings?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("update_user_profile", {
    p_avatar_url: params.avatarUrl,
    p_display_name: params.displayName,
    p_first_name: params.firstName,
    p_last_name: params.lastName,
    p_settings: params.settings,
  });
  return { data, error };
}

/**
 * Search for users
 */
export async function searchUsers(query: string, limit: number = 10) {
  const { data, error } = await supabase.rpc("search_users", {
    p_query: query,
    p_limit: limit,
  });
  return { data, error };
}

/**
 * Update user presence (last seen)
 */
export async function updateUserPresence() {
  const { data, error } = await supabase.rpc("update_user_presence");
  return { data, error };
}

/**
 * Handle user logout
 */
export async function handleUserLogout() {
  const { data, error } = await supabase.rpc("handle_user_logout");
  return { data, error };
}

/**
 * Check user session status
 */
export async function checkUserSessionStatus(email?: string) {
  const { data, error } = await supabase.rpc("check_user_session_status", {
    p_email: email,
  });
  return { data, error };
}

// ============================================================================
// SOCIAL FUNCTIONS (Following/Blocking)
// ============================================================================

/**
 * Follow a user
 */
export async function followUser(targetUserId: string) {
  const { data, error } = await supabase.rpc("follow_user", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string) {
  const { data, error } = await supabase.rpc("unfollow_user", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Toggle follow status
 */
export async function toggleFollow(targetUserId: string) {
  const { data, error } = await supabase.rpc("toggle_follow", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Block a user
 */
export async function blockUser(targetUserId: string) {
  const { data, error } = await supabase.rpc("block_user", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

/**
 * Unblock a user
 */
export async function unblockUser(targetUserId: string) {
  const { data, error } = await supabase.rpc("unblock_user", {
    target_user_id: targetUserId,
  });
  return { data, error };
}

// ============================================================================
// CONTENT/POST FUNCTIONS
// ============================================================================

/**
 * Create a new post
 */
export async function createPost(params: {
  caption?: string;
  images?: string[];
  postType?: "video" | "image" | "text" | "carousel";
  tags?: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  visibility?: "public" | "followers" | "private";
}) {
  const { data, error } = await supabase.rpc("create_post", {
    p_caption: params.caption,
    p_images: params.images,
    p_post_type: params.postType,
    p_tags: params.tags,
    p_thumbnail_url: params.thumbnailUrl,
    p_video_url: params.videoUrl,
    p_visibility: params.visibility,
  });
  return { data, error };
}

/**
 * Get user posts
 */
export async function getUserPosts(params?: {
  targetUserId?: string;
  limit?: number;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("get_user_posts", {
    target_user_id: params?.targetUserId,
    p_limit: params?.limit || 20,
    p_offset: params?.offset || 0,
  });
  return { data, error };
}

/**
 * Get user posts with stats
 */
export async function getUserPostsWithStats(params: {
  targetUserId: string;
  limit?: number;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("get_user_posts_with_stats", {
    target_user_id: params.targetUserId,
    limit_count: params.limit || 20,
    offset_count: params.offset || 0,
  });
  return { data, error };
}

/**
 * Get user feed
 */
export async function getUserFeed(limit: number = 20, offset: number = 0) {
  const { data, error } = await supabase.rpc("get_user_feed", {
    p_limit: limit,
    p_offset: offset,
  });
  return { data, error };
}

/**
 * Toggle like on a post
 */
export async function togglePostLike(postId: string) {
  const { data, error } = await supabase.rpc("toggle_post_like", {
    post_id: postId,
  });
  return { data, error };
}

/**
 * Add a comment to a post
 */
export async function addComment(params: {
  videoId: string;
  content: string;
  parentCommentId?: string;
}) {
  const { data, error } = await supabase.rpc("add_comment", {
    p_video_id: params.videoId,
    p_content: params.content,
    p_parent_comment_id: params.parentCommentId,
  });
  return { data, error };
}

/**
 * Increment view counts for posts
 */
export async function incrementViewCounts(postIds: string[], userId: string) {
  const { data, error } = await supabase.rpc("increment_view_counts", {
    post_ids: postIds,
    user_id_param: userId,
  });
  return { data, error };
}

/**
 * Batch update trending scores
 */
export async function batchUpdateTrendingScores(
  updates: Array<{ postId: string; trendingScore: number }>,
) {
  const { data, error } = await supabase.rpc("batch_update_trending_scores", {
    updates,
  });
  return { data, error };
}

// ============================================================================
// CHAT/MESSAGING FUNCTIONS
// ============================================================================

/**
 * Get or create a direct message conversation
 */
export async function getOrCreateDmConversation(otherUserId: string) {
  const { data, error } = await supabase.rpc("get_or_create_dm_conversation", {
    other_user_id: otherUserId,
  });
  return { data, error };
}

/**
 * Get user conversations
 */
export async function getUserConversations() {
  const { data, error } = await supabase.rpc("get_user_conversations");
  return { data, error };
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(params: {
  conversationId: string;
  limit?: number;
  beforeMessageId?: string;
}) {
  const { data, error } = await supabase.rpc("get_conversation_messages", {
    p_conversation_id: params.conversationId,
    p_limit: params.limit || 50,
    p_before_message_id: params.beforeMessageId,
  });
  return { data, error };
}

/**
 * Get enhanced conversation messages (with reactions)
 */
export async function getConversationMessagesEnhanced(params: {
  conversationId: string;
  limit?: number;
  beforeMessageId?: string;
}) {
  const { data, error } = await supabase.rpc(
    "get_conversation_messages_enhanced",
    {
      p_conversation_id: params.conversationId,
      p_limit: params.limit || 50,
      p_before_message_id: params.beforeMessageId,
    },
  );
  return { data, error };
}

/**
 * Send a message
 */
export async function sendMessage(params: {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "system" | "deleted";
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "file" | "gif";
  replyToId?: string;
}) {
  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: params.conversationId,
    p_content: params.content,
    p_message_type: params.messageType || "text",
    p_media_url: params.mediaUrl,
    p_media_type: params.mediaType,
    p_reply_to_id: params.replyToId,
  });
  return { data, error };
}

/**
 * Send a message (safe version with additional checks)
 */
export async function sendMessageSafe(params: {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "system" | "deleted";
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "file" | "gif";
  replyToId?: string;
}) {
  const { data, error } = await supabase.rpc("send_message_safe", {
    p_conversation_id: params.conversationId,
    p_content: params.content,
    p_message_type: params.messageType || "text",
    p_media_url: params.mediaUrl,
    p_media_type: params.mediaType,
    p_reply_to_id: params.replyToId,
  });
  return { data, error };
}

/**
 * Set typing status in a conversation
 */
export async function setTypingStatus(
  conversationId: string,
  isTyping: boolean = true,
) {
  const { data, error } = await supabase.rpc("set_typing_status", {
    p_conversation_id: conversationId,
    p_is_typing: isTyping,
  });
  return { data, error };
}

/**
 * Subscribe to conversation messages
 */
export async function subscribeToConversationMessages(conversationId: string) {
  const { data, error } = await supabase.rpc(
    "subscribe_to_conversation_messages",
    {
      p_conversation_id: conversationId,
    },
  );
  return { data, error };
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Get notifications
 */
export async function getNotifications(limit: number = 20, offset: number = 0) {
  const { data, error } = await supabase.rpc("get_notifications", {
    p_limit: limit,
    p_offset: offset,
  });
  return { data, error };
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase.rpc("mark_notification_read", {
    notification_id: notificationId,
  });
  return { data, error };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  const { data, error } = await supabase.rpc("mark_all_notifications_read");
  return { data, error };
}

/**
 * Register a push notification token
 */
export async function registerPushToken(params: {
  token: string;
  platform?: "web" | "ios" | "android";
  deviceInfo?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("register_push_token", {
    p_token: params.token,
    p_platform: params.platform || "web",
    p_device_info: params.deviceInfo,
  });
  return { data, error };
}

// ============================================================================
// MENU FUNCTIONS
// ============================================================================

/**
 * Get complete menu
 */
export async function getCompleteMenu() {
  const { data, error } = await supabase.rpc("get_complete_menu");
  return { data, error };
}

/**
 * Get menu items by type
 */
export async function getMenuItemsByType(itemType?: "food" | "drink") {
  const { data, error } = await supabase.rpc("get_menu_items_by_type", {
    item_type: itemType,
  });
  return { data, error };
}

// ============================================================================
// SYSTEM/MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Check system health
 */
export async function checkSystemHealth() {
  const { data, error } = await supabase.rpc("check_system_health");
  return { data, error };
}

/**
 * Get API documentation
 */
export async function getApiDocumentation() {
  const { data, error } = await supabase.rpc("get_api_documentation");
  return { data, error };
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics() {
  const { data, error } = await supabase.rpc("get_performance_metrics");
  return { data, error };
}

/**
 * Get cron jobs status
 */
export async function getCronJobsStatus() {
  const { data, error } = await supabase.rpc("get_cron_jobs_status");
  return { data, error };
}

/**
 * Get last cleanup status
 */
export async function getLastCleanupStatus() {
  const { data, error } = await supabase.rpc("get_last_cleanup_status");
  return { data, error };
}

// ============================================================================
// CLEANUP FUNCTIONS (Admin only)
// ============================================================================

/**
 * Cleanup old typing indicators
 */
export async function cleanupOldTypingIndicators() {
  const { data, error } = await supabase.rpc("cleanup_old_typing_indicators");
  return { data, error };
}

/**
 * Perform maintenance
 */
export async function performMaintenance() {
  const { data, error } = await supabase.rpc("perform_maintenance");
  return { data, error };
}

/**
 * Run automated cleanup
 */
export async function runAutomatedCleanup() {
  const { data, error } = await supabase.rpc("run_automated_cleanup");
  return { data, error };
}

/**
 * Run cleanup job
 */
export async function runCleanupJob() {
  const { data, error } = await supabase.rpc("run_cleanup_job");
  return { data, error };
}
