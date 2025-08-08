/**
 * Centralized Data Access Service
 * Provides controlled, optimized access to all data operations
 */

import { supabase } from '@/lib/supabase';
// Simple error handling without external dependency
const errorService = {
  logError: (error: Error, context: string) => {
    console.error(`[${context}] ${error.message}`, error);
  }
};

enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTH = 'auth'
}

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
  private cache = new Map<string, CacheEntry<any>>();
  private supabase = supabase;
  private defaultTimeout = 5000;
  private defaultCacheTTL = 300000; // 5 minutes

  /**
   * Execute a query with comprehensive error handling and caching
   */
  async executeQuery<T>(
    queryBuilder: () => Promise<{ data: T; error: any }>,
    operation: string,
    options: QueryOptions = {}
  ): Promise<T> {
    const {
      useCache = false,
      cacheKey,
      cacheTTL = this.defaultCacheTTL,
      timeout = this.defaultTimeout,
      retries = 2
    } = options;

    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query with timeout and retries
    const executeWithRetry = async (attempt: number = 1): Promise<T> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        const { data, error } = await Promise.race([
          queryBuilder(),
          timeoutPromise
        ]);

        if (error) {
          throw new Error(error.message);
        }

        // Cache successful result
        if (useCache && cacheKey && data) {
          this.setCache(cacheKey, data, cacheTTL);
        }

        return data;
      } catch (error) {
        const err = error as Error;
        
        // Retry logic for retryable errors
        if (attempt <= retries && this.isRetryableError(err)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeWithRetry(attempt + 1);
        }

        // Handle different types of errors
        throw errorService.handleDatabaseError(err, operation, {
          attempt,
          maxRetries: retries,
          cacheKey,
          timeout
        });
      }
    };

    return executeWithRetry();
  }

  /**
   * Wolfpack Members Operations
   */
  async getWolfpackMembers(location?: string): Promise<any[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from('users')
          .select(`
            id, display_name, wolf_emoji, vibe_status,
            profile_image_url, bio, favorite_drink,
            is_wolfpack_member, wolfpack_join_date,
            last_seen_at, is_online
          `)
          .eq('is_wolfpack_member', true)
          .order('last_seen_at', { ascending: false })
          .limit(100);

        if (location) {
          query = query.eq('preferred_location', location);
        }

        return await query;
      },
      'getWolfpackMembers',
      {
        useCache: true,
        cacheKey: `wolf-pack-members_${location || 'all'}`,
        cacheTTL: 60000 // 1 minute for member data
      }
    );
  }

  async updateWolfpackMember(userId: string, updates: any): Promise<any> {
    const result = await this.executeQuery(
      async () => await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single(),
      'updateWolfpackMember'
    );

    // Invalidate related cache entries
    this.invalidateCachePattern('wolf-pack-members_');
    this.invalidateCachePattern(`user_${userId}`);

    return result;
  }

  /**
   * Private Messages Operations
   */
  async getPrivateMessages(userId1: string, userId2: string, limit: number = 100): Promise<any[]> {
    return this.executeQuery(
      async () => await this.supabase
        .from('wolf_private_messages')
        .select(`
          *,
          sender_user:users!wolf_private_messages_sender_id_fkey(
            display_name, wolf_emoji, profile_image_url
          )
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(limit),
      'getPrivateMessages',
      {
        useCache: true,
        cacheKey: `messages_${[userId1, userId2].sort().join('_')}`,
        cacheTTL: 30000 // 30 seconds for messages
      }
    );
  }

  async sendPrivateMessage(senderId: string, receiverId: string, message: string): Promise<any> {
    const result = await this.executeQuery(
      async () => await this.supabase
        .from('wolf_private_messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          is_read: false,
          is_deleted: false,
          flagged: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single(),
      'sendPrivateMessage'
    );

    // Invalidate message cache
    this.invalidateCachePattern(`messages_${[senderId, receiverId].sort().join('_')}`);

    return result;
  }

  /**
   * Menu Operations
   */
  async getMenuItems(categoryId?: string, location?: string): Promise<any[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from('food_drink_items')
          .select(`
            *, 
            category:food_drink_categories(*),
            modifiers:menu_item_modifiers(*)
          `)
          .eq('is_available', true)
          .order('display_order');

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        // TODO: Add location filtering when implemented in schema
        // if (location) {
        //   query = query.contains('available_locations', [location]);
        // }

        return query;
      },
      'getMenuItems',
      {
        useCache: true,
        cacheKey: `menu_items_${categoryId || 'all'}_${location || 'all'}`,
        cacheTTL: 600000 // 10 minutes for menu data
      }
    );
  }

  async getMenuCategories(location?: string): Promise<any[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from('food_drink_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        // TODO: Add location filtering when implemented in schema
        // if (location) {
        //   query = query.contains('available_locations', [location]);
        // }

        return query;
      },
      'getMenuCategories',
      {
        useCache: true,
        cacheKey: `menu_categories_${location || 'all'}`,
        cacheTTL: 600000 // 10 minutes
      }
    );
  }

  /**
   * DJ Events Operations
   */
  async getDJEvents(location?: string, status?: string): Promise<any[]> {
    return this.executeQuery(
      async () => {
        let query = this.supabase
          .from('dj_events')
          .select(`
            *,
            contestants:dj_event_participants(*),
            votes:wolf_pack_votes(*)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (location) {
          query = query.eq('location_id', location);
        }

        if (status) {
          query = query.eq('status', status);
        }

        return query;
      },
      'getDJEvents',
      {
        useCache: true,
        cacheKey: `dj_events_${location || 'all'}_${status || 'all'}`,
        cacheTTL: 30000 // 30 seconds for live events
      }
    );
  }

  async createDJEvent(eventData: any): Promise<any> {
    const result = await this.executeQuery(
      async () => await this.supabase
        .from('dj_events')
        .insert(eventData)
        .select()
        .single(),
      'createDJEvent'
    );

    // Invalidate events cache
    this.invalidateCachePattern('dj_events_');

    return result;
  }

  /**
   * User Operations
   */
  async getUser(userId: string): Promise<any> {
    return this.executeQuery(
      async () => await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      'getUser',
      {
        useCache: true,
        cacheKey: `user_${userId}`,
        cacheTTL: 300000 // 5 minutes
      }
    );
  }

  async updateUser(userId: string, updates: any): Promise<any> {
    const result = await this.executeQuery(
      async () => await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single(),
      'updateUser'
    );

    // Invalidate user cache
    this.invalidateCache(`user_${userId}`);
    this.invalidateCachePattern('wolf-pack-members_');

    return result;
  }

  /**
   * Batch Operations for Performance
   */
  async batchExecute<T>(
    operations: Array<() => Promise<T>>,
    operationName: string
  ): Promise<T[]> {
    try {
      const results = await Promise.allSettled(operations.map(op => op()));
      
      const successful: T[] = [];
      const failed: Error[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(new Error(`Batch operation ${index} failed: ${result.reason}`));
        }
      });

      if (failed.length > 0) {
        errorService.createError(
          `Batch operation partially failed: ${operationName}`,
          'Some operations could not be completed',
          ErrorSeverity.MEDIUM,
          ErrorCategory.DATABASE,
          {
            operation: operationName,
            metadata: {
              successfulCount: successful.length,
              failedCount: failed.length,
              totalCount: operations.length
            }
          }
        );
      }

      return successful;
    } catch (error) {
      throw errorService.handleDatabaseError(
        error as Error,
        `batchExecute: ${operationName}`
      );
    }
  }

  /**
   * Cache Management
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
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
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
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
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      errorService.handleDatabaseError(
        error as Error,
        'testConnection'
      );
      return false;
    }
  }

  /**
   * Helper Methods
   */
  private isRetryableError(error: Error): boolean {
    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'rate limit'
    ];

    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Performance monitoring
   */
  async monitorQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const duration = performance.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const dataService = new DataService();

// Export types for use in components
export type {
  QueryOptions,
  CacheEntry
};