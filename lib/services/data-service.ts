/**
 * Centralized Data Access Service
 * Provides controlled, optimized access to all data operations
 */

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

// Type aliases for better readability
type Tables = Database["public"]["Tables"];
type User = Tables["users"]["Row"];
type ContentPost = Tables["content_posts"]["Row"];
type MenuItem = Tables["menu_items"]["Row"];
type MenuCategory = Tables["menu_categories"]["Row"];
type ChatMessage = Tables["chat_messages"]["Row"];
type ChatConversation = Tables["chat_conversations"]["Row"];
type Notification = Tables["notifications"]["Row"];
type SocialFollow = Tables["social_follows"]["Row"];

// Extended types for joined queries
interface ContentPostWithUser extends ContentPost {
  user?: User;
}

interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory;
}

interface ChatMessageWithSender extends ChatMessage {
  sender?: User;
}

interface NotificationWithRelatedUser extends Notification {
  related_user?: User;
}

// Simple error handling without external dependency
const errorService = {
  logError: (error: Error, context: string) => {
    console.error(`[${context}] ${error.message}`, error);
  },
};

interface QueryOptions {
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
  timeout?: number;
  retries?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private supabase = supabase;
  private defaultTimeout = 5000;
  private defaultCacheTTL = 300000; // 5 minutes

  /**
   * Execute a query with comprehensive error handling and caching
   */
  async executeQuery<T>(
    queryBuilder: () => Promise<{ data: T | null; error: Error | null }>,
    operation: string,
    options: QueryOptions = {},
  ): Promise<T> {
    const {
      useCache = false,
      cacheKey,
      cacheTTL = this.defaultCacheTTL,
      timeout = this.defaultTimeout,
      retries = 2,
    } = options;

    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Execute query with timeout and retries
    const executeWithRetry = async (attempt: number = 1): Promise<T> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Query timeout")), timeout);
        });

        const result = await Promise.race([
          queryBuilder(),
          timeoutPromise,
        ]) as { data: T | null; error: Error | null };

        if (result.error) {
          throw new Error(result.error.message || String(result.error));
        }

        if (result.data === null || result.data === undefined) {
          throw new Error(`No data returned from ${operation}`);
        }

        // Cache successful result
        if (useCache && cacheKey && result.data) {
          this.setCache(cacheKey, result.data, cacheTTL);
        }

        return result.data;
      } catch (error) {
        const err = error as Error;

        // Retry logic for retryable errors
        if (attempt <= retries && this.isRetryableError(err)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeWithRetry(attempt + 1);
        }

        // Handle different types of errors
        errorService.logError(err, operation);
        throw new Error(`${operation} failed: ${err.message}`);
      }
    };

    return executeWithRetry();
  }

  /**
   * User Operations
   */
  async getUser(userId: string): Promise<User> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        // Explicitly handle the response structure
        return {
          data: result.data as User | null,
          error: result.error,
        };
      },
      "getUser",
      {
        useCache: true,
        cacheKey: `user_${userId}`,
        cacheTTL: 300000, // 5 minutes
      },
    );
  }

  async getUserProfile(username: string): Promise<User> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        return {
          data: result.data as User | null,
          error: result.error,
        };
      },
      "getUserProfile",
      {
        useCache: true,
        cacheKey: `user_profile_${username}`,
        cacheTTL: 300000,
      },
    );
  }

  async updateUser(
    userId: string,
    updates: Partial<Tables["users"]["Update"]>,
  ): Promise<User> {
    const result = await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("users")
          .update(updates)
          .eq("id", userId)
          .select()
          .single();

        return {
          data: result.data as User | null,
          error: result.error,
        };
      },
      "updateUser",
    );

    // Invalidate user cache
    this.invalidateCache(`user_${userId}`);
    this.invalidateCachePattern("active_users_");

    return result;
  }

  async getActiveUsers(limit: number = 50): Promise<User[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("users")
          .select("*")
          .eq("account_status", "active")
          .order("last_seen_at", { ascending: false })
          .limit(limit);

        return {
          data: (result.data || []) as User[],
          error: result.error,
        };
      },
      "getActiveUsers",
      {
        useCache: true,
        cacheKey: `active_users_${limit}`,
        cacheTTL: 60000, // 1 minute
      },
    );
  }

  /**
   * Content/Posts Operations
   */
  async getContentPosts(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ContentPostWithUser[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("content_posts")
          .select(`
            *,
            user:users(*)
          `)
          .eq("is_active", true)
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        return {
          data: result.data as unknown as ContentPostWithUser[],
          error: result.error,
        };
      },
      "getContentPosts",
      {
        useCache: true,
        cacheKey: `content_posts_${limit}_${offset}`,
        cacheTTL: 30000, // 30 seconds
      },
    );
  }

  async getUserPosts(
    userId: string,
    limit: number = 20,
  ): Promise<ContentPost[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("content_posts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(limit);

        return {
          data: (result.data || []) as ContentPost[],
          error: result.error,
        };
      },
      "getUserPosts",
      {
        useCache: true,
        cacheKey: `user_posts_${userId}_${limit}`,
        cacheTTL: 60000,
      },
    );
  }

  async createPost(
    post: Tables["content_posts"]["Insert"],
  ): Promise<ContentPost> {
    const result = await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("content_posts")
          .insert(post)
          .select()
          .single();

        return {
          data: result.data as ContentPost | null,
          error: result.error,
        };
      },
      "createPost",
    );

    // Invalidate posts cache
    this.invalidateCachePattern("content_posts_");
    this.invalidateCachePattern(`user_posts_${post.user_id}`);

    return result;
  }

  async togglePostLike(postId: string, userId: string): Promise<void> {
    await this.executeQuery(
      async () => {
        const result = await this.supabase.rpc("toggle_post_like", {
          p_post_id: postId,
          p_user_id: userId,
        });
        return { ...result, data: result.data || undefined };
      },
      "togglePostLike",
    );

    // Invalidate related caches
    this.invalidateCachePattern(`post_${postId}`);
  }

  /**
   * Social/Following Operations
   */
  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<SocialFollow> {
    const result = await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("social_follows")
          .insert({
            follower_id: followerId,
            following_id: followingId,
          })
          .select()
          .single();

        return {
          data: result.data as SocialFollow | null,
          error: result.error,
        };
      },
      "followUser",
    );

    // Invalidate follower/following caches
    this.invalidateCachePattern(`followers_${followingId}`);
    this.invalidateCachePattern(`following_${followerId}`);

    return result;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("social_follows")
          .delete()
          .eq("follower_id", followerId)
          .eq("following_id", followingId);

        return { ...result, data: result.data || undefined };
      },
      "unfollowUser",
    );

    // Invalidate follower/following caches
    this.invalidateCachePattern(`followers_${followingId}`);
    this.invalidateCachePattern(`following_${followerId}`);
  }

  async getFollowers(userId: string): Promise<User[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("social_follows")
          .select(`
            follower:users!social_follows_follower_fkey(*)
          `)
          .eq("following_id", userId)
          .order("created_at", { ascending: false });

        const followers =
          result.data?.map((item: unknown) =>
            (item as { follower: User }).follower
          ) || [];
        return {
          data: followers,
          error: result.error,
        };
      },
      "getFollowers",
      {
        useCache: true,
        cacheKey: `followers_${userId}`,
        cacheTTL: 120000, // 2 minutes
      },
    );
  }

  async getFollowing(userId: string): Promise<User[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("social_follows")
          .select(`
            following:users!social_follows_following_fkey(*)
          `)
          .eq("follower_id", userId)
          .order("created_at", { ascending: false });

        const following =
          result.data?.map((item: unknown) =>
            (item as { following: User }).following
          ) || [];
        return {
          data: following,
          error: result.error,
        };
      },
      "getFollowing",
      {
        useCache: true,
        cacheKey: `following_${userId}`,
        cacheTTL: 120000,
      },
    );
  }

  /**
   * Chat/Messaging Operations
   */
  async getConversations(userId: string): Promise<ChatConversation[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("chat_participants")
          .select(`
            conversation:chat_conversations(*)
          `)
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("updated_at", { ascending: false });

        const conversations =
          result.data?.map((item: unknown) =>
            (item as { conversation: ChatConversation }).conversation
          ) || [];
        return {
          data: conversations,
          error: result.error,
        };
      },
      "getConversations",
      {
        useCache: true,
        cacheKey: `conversations_${userId}`,
        cacheTTL: 30000,
      },
    );
  }

  async getMessages(
    conversationId: string,
    limit: number = 50,
  ): Promise<ChatMessageWithSender[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("chat_messages")
          .select(`
            *,
            sender:users!chat_messages_sender_id_fkey(*)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(limit);

        return {
          data: result.data as unknown as ChatMessageWithSender[],
          error: result.error,
        };
      },
      "getMessages",
      {
        useCache: true,
        cacheKey: `messages_${conversationId}_${limit}`,
        cacheTTL: 10000, // 10 seconds for messages
      },
    );
  }

  async sendMessage(
    message: Tables["chat_messages"]["Insert"],
  ): Promise<ChatMessage> {
    const result = await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("chat_messages")
          .insert(message)
          .select()
          .single();

        return {
          data: result.data as ChatMessage | null,
          error: result.error,
        };
      },
      "sendMessage",
    );

    // Invalidate message cache
    this.invalidateCachePattern(`messages_${message.conversation_id}`);
    this.invalidateCachePattern(`conversations_${message.sender_id}`);

    return result;
  }

  /**
   * Menu Operations
   */
  async getMenuItems(categoryId?: string): Promise<MenuItemWithCategory[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from("menu_items")
          .select(`
            *, 
            category:menu_categories(*)
          `)
          .eq("is_active", true)
          .eq("is_available", true)
          .order("display_order");

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }

        const result = await query;

        return {
          data: result.data as unknown as MenuItemWithCategory[],
          error: result.error,
        };
      },
      "getMenuItems",
      {
        useCache: true,
        cacheKey: `menu_items_${categoryId || "all"}`,
        cacheTTL: 600000, // 10 minutes for menu data
      },
    );
  }

  async getMenuCategories(type?: "food" | "drink"): Promise<MenuCategory[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from("menu_categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order");

        if (type) {
          query = query.eq("type", type);
        }

        const result = await query;

        return {
          data: (result.data || []) as MenuCategory[],
          error: result.error,
        };
      },
      "getMenuCategories",
      {
        useCache: true,
        cacheKey: `menu_categories_${type || "all"}`,
        cacheTTL: 600000, // 10 minutes
      },
    );
  }

  async getFeaturedMenuItems(): Promise<MenuItemWithCategory[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("menu_items")
          .select(`
            *, 
            category:menu_categories(*)
          `)
          .eq("is_featured", true)
          .eq("is_active", true)
          .eq("is_available", true)
          .order("display_order")
          .limit(10);

        return {
          data: result.data as unknown as MenuItemWithCategory[],
          error: result.error,
        };
      },
      "getFeaturedMenuItems",
      {
        useCache: true,
        cacheKey: "featured_menu_items",
        cacheTTL: 300000, // 5 minutes
      },
    );
  }

  /**
   * Notifications Operations
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<NotificationWithRelatedUser[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("notifications")
          .select(`
            *,
            related_user:users!notifications_related_user_fkey(*)
          `)
          .eq("recipient_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        return {
          data: result.data as unknown as NotificationWithRelatedUser[],
          error: result.error,
        };
      },
      "getNotifications",
      {
        useCache: true,
        cacheKey: `notifications_${userId}_${limit}`,
        cacheTTL: 30000, // 30 seconds
      },
    );
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("notifications")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("id", notificationId);

        return { ...result, data: result.data || undefined };
      },
      "markNotificationRead",
    );

    // Invalidate notifications cache
    this.invalidateCachePattern("notifications_");
  }

  async createNotification(
    notification: Tables["notifications"]["Insert"],
  ): Promise<Notification> {
    const result = await this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("notifications")
          .insert(notification)
          .select()
          .single();

        return {
          data: result.data as Notification | null,
          error: result.error,
        };
      },
      "createNotification",
    );

    // Invalidate notifications cache for recipient
    this.invalidateCachePattern(`notifications_${notification.recipient_id}`);

    return result;
  }

  /**
   * Search Operations
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("users")
          .select("*")
          .or(
            `username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`,
          )
          .eq("account_status", "active")
          .limit(limit);

        return {
          data: (result.data || []) as User[],
          error: result.error,
        };
      },
      "searchUsers",
      {
        useCache: true,
        cacheKey: `search_users_${query}_${limit}`,
        cacheTTL: 60000,
      },
    );
  }

  async searchMenuItems(query: string): Promise<MenuItemWithCategory[]> {
    return this.executeQuery(
      async () => {
        const result = await this.supabase
          .from("menu_items")
          .select(`
            *, 
            category:menu_categories(*)
          `)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .eq("is_active", true)
          .eq("is_available", true)
          .limit(20);

        return {
          data: result.data as unknown as MenuItemWithCategory[],
          error: result.error,
        };
      },
      "searchMenuItems",
      {
        useCache: true,
        cacheKey: `search_menu_${query}`,
        cacheTTL: 120000,
      },
    );
  }

  /**
   * Batch Operations for Performance
   */
  async batchExecute<T>(
    operations: Array<() => Promise<T>>,
    operationName: string,
  ): Promise<T[]> {
    try {
      const results = await Promise.allSettled(operations.map((op) => op()));

      const successful: T[] = [];
      const failed: Error[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(result.value);
        } else {
          failed.push(
            new Error(`Batch operation ${index} failed: ${result.reason}`),
          );
        }
      });

      if (failed.length > 0) {
        errorService.logError(
          new Error(`Batch operation partially failed: ${operationName}`),
          "batchExecute",
        );
      }

      return successful;
    } catch (error) {
      errorService.logError(error as Error, "batchExecute");
      throw new Error(`batchExecute failed: ${operationName}`);
    }
  }

  /**
   * Real-time Subscriptions
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void,
  ) {
    return this.supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
          // Invalidate cache for new messages
          this.invalidateCachePattern(`messages_${conversationId}`);
        },
      )
      .subscribe();
  }

  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void,
  ) {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
          // Invalidate cache for new notifications
          this.invalidateCachePattern(`notifications_${userId}`);
        },
      )
      .subscribe();
  }

  /**
   * Cache Management
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  invalidateCachePattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(pattern)
    );

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const cacheEntry = entry as CacheEntry<unknown>;
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health and Monitoring
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const size = this.cache.size;
    // This would track hits/misses in a real implementation
    const hitRate = 0.85; // Placeholder
    const memoryUsage = `${Math.round(size * 0.001)}KB`; // Rough estimate

    return { size, hitRate, memoryUsage };
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("users")
        .select("id")
        .limit(1);

      return !error;
    } catch (error) {
      errorService.logError(error as Error, "testConnection");
      return false;
    }
  }

  /**
   * Helper Methods
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      "timeout",
      "connection",
      "network",
      "temporary",
      "rate limit",
    ];

    return retryableMessages.some((msg) =>
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Performance monitoring
   */
  async monitorQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>,
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFunction();
      const duration = performance.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        console.warn(
          `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`,
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `Query failed: ${queryName} after ${duration.toFixed(2)}ms`,
        error,
      );
      throw error;
    }
  }
}

// Create singleton instance
export const dataService = new DataService();

// Export types for use in components
export type {
  CacheEntry,
  ChatConversation,
  ChatMessage,
  ChatMessageWithSender,
  ContentPost,
  ContentPostWithUser,
  MenuCategory,
  MenuItem,
  MenuItemWithCategory,
  Notification,
  NotificationWithRelatedUser,
  QueryOptions,
  SocialFollow,
  User,
};
