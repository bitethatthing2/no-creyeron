'use client';

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionManager {
  channels: Map<string, RealtimeChannel>;
  subscriptions: Map<string, {
    channel: RealtimeChannel;
    lastActivity: number;
    subscribers: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  maxChannels: number;
  cleanupInterval: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface PerformanceMetrics {
  subscriptionCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
  dataTransferRate: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private subscriptionManager: SubscriptionManager;
  private cache: Map<string, CacheEntry<any>>;
  private metrics: PerformanceMetrics;
  private performanceTimer: Map<string, number>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.subscriptionManager = {
      channels: new Map(),
      subscriptions: new Map(),
      maxChannels: 10, // Limit concurrent channels
      cleanupInterval: 30000 // 30 seconds
    };

    this.cache = new Map();
    this.performanceTimer = new Map();
    
    this.metrics = {
      subscriptionCount: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      activeConnections: 0,
      dataTransferRate: 0
    };

    this.initializeCleanup();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Initialize cleanup intervals
  private initializeCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
      this.cleanupExpiredCache();
      this.updateMetrics();
    }, this.subscriptionManager.cleanupInterval);
  }

  // Optimized subscription management
  public createOptimizedSubscription(
    channelName: string,
    config: {
      table: string;
      filter?: string;
      priority?: 'high' | 'medium' | 'low';
      ttl?: number;
    },
    callback: (payload: any) => void
  ): string {
    const subscriptionId = `${channelName}_${Date.now()}`;
    
    // Check if we already have this subscription
    const existingSubscription = this.subscriptionManager.subscriptions.get(channelName);
    if (existingSubscription) {
      existingSubscription.subscribers++;
      existingSubscription.lastActivity = Date.now();
      return subscriptionId;
    }

    // Cleanup old subscriptions if we're at the limit
    if (this.subscriptionManager.subscriptions.size >= this.subscriptionManager.maxChannels) {
      this.cleanupLowestPrioritySubscriptions();
    }

    // Create new subscription
    const channel = supabase.channel(channelName);
    
    // Add postgres changes listener
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: config.table,
        filter: config.filter
      },
      (payload) => {
        this.trackPerformance(`callback_${channelName}`, () => {
          callback(payload);
        });
      }
    );

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.metrics.activeConnections++;
      } else if (status === 'CLOSED') {
        this.metrics.activeConnections--;
      }
    });

    // Store subscription info
    this.subscriptionManager.subscriptions.set(channelName, {
      channel,
      lastActivity: Date.now(),
      subscribers: 1,
      priority: config.priority || 'medium'
    });

    this.metrics.subscriptionCount++;
    return subscriptionId;
  }

  // Unsubscribe from channel
  public unsubscribe(channelName: string): void {
    const subscription = this.subscriptionManager.subscriptions.get(channelName);
    if (subscription) {
      subscription.subscribers--;
      
      if (subscription.subscribers <= 0) {
        subscription.channel.unsubscribe();
        this.subscriptionManager.subscriptions.delete(channelName);
        this.metrics.subscriptionCount--;
      }
    }
  }

  // Optimized caching system
  public setCache<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now()
    };
    
    this.cache.set(key, entry);
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    // Update cache hit rate
    this.updateCacheHitRate(true);
    
    return entry.data;
  }

  // Batch data loading with deduplication
  public async batchLoad<T>(
    keys: string[],
    loader: (keys: string[]) => Promise<Map<string, T>>,
    ttl: number = 300000
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const keysToLoad: string[] = [];

    // Check cache first
    for (const key of keys) {
      const cached = this.getCache<T>(key);
      if (cached) {
        results.set(key, cached);
      } else {
        keysToLoad.push(key);
      }
    }

    // Load missing data
    if (keysToLoad.length > 0) {
      const startTime = Date.now();
      const loadedData = await loader(keysToLoad);
      const loadTime = Date.now() - startTime;
      
      this.updateAverageResponseTime(loadTime);

      // Cache loaded data
      for (const [key, data] of loadedData) {
        this.setCache(key, data, ttl);
        results.set(key, data);
      }
    }

    return results;
  }

  // Debounced updates
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  public debounce<T extends any[]>(
    key: string,
    func: (...args: T) => void,
    delay: number = 300
  ): (...args: T) => void {
    return (...args: T) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  // Performance tracking
  private trackPerformance<T>(operation: string, func: () => T): T {
    const startTime = Date.now();
    this.performanceTimer.set(operation, startTime);
    
    try {
      const result = func();
      return result;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.updateAverageResponseTime(duration);
      this.performanceTimer.delete(operation);
    }
  }

  // Connection pooling for database queries
  private connectionPool: Map<string, Promise<any>> = new Map();

  public async pooledQuery<T>(
    queryKey: string,
    queryFunc: () => Promise<T>,
    ttl: number = 60000
  ): Promise<T> {
    // Check if query is already in progress
    const existingQuery = this.connectionPool.get(queryKey);
    if (existingQuery) {
      return existingQuery;
    }

    // Check cache
    const cached = this.getCache<T>(queryKey);
    if (cached) {
      return cached;
    }

    // Execute query
    const queryPromise = queryFunc().then(result => {
      this.setCache(queryKey, result, ttl);
      this.connectionPool.delete(queryKey);
      return result;
    }).catch(error => {
      this.connectionPool.delete(queryKey);
      throw error;
    });

    this.connectionPool.set(queryKey, queryPromise);
    return queryPromise;
  }

  // Cleanup functions
  private cleanupInactiveSubscriptions(): void {
    const now = Date.now();
    const inactiveThreshold = 300000; // 5 minutes

    for (const [channelName, subscription] of this.subscriptionManager.subscriptions) {
      if (now - subscription.lastActivity > inactiveThreshold && subscription.subscribers === 0) {
        subscription.channel.unsubscribe();
        this.subscriptionManager.subscriptions.delete(channelName);
        this.metrics.subscriptionCount--;
      }
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private cleanupLowestPrioritySubscriptions(): void {
    const priorityOrder = { low: 1, medium: 2, high: 3 };
    
    const subscriptions = Array.from(this.subscriptionManager.subscriptions.entries())
      .sort(([, a], [, b]) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastActivity - b.lastActivity;
      });

    // Remove lowest priority, oldest subscriptions
    const toRemove = subscriptions.slice(0, Math.floor(subscriptions.length / 4));
    for (const [channelName, subscription] of toRemove) {
      subscription.channel.unsubscribe();
      this.subscriptionManager.subscriptions.delete(channelName);
      this.metrics.subscriptionCount--;
    }
  }

  // Metrics updates
  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average
    this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + (hit ? 0.1 : 0);
  }

  private updateAverageResponseTime(responseTime: number): void {
    // Simple moving average
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
  }

  private updateMetrics(): void {
    this.metrics.memoryUsage = this.cache.size;
    this.metrics.subscriptionCount = this.subscriptionManager.subscriptions.size;
    
    // Log metrics for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', this.metrics);
    }
  }

  // Public API for getting metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Public API for manual cleanup
  public cleanup(): void {
    // Cleanup all subscriptions
    for (const [, subscription] of this.subscriptionManager.subscriptions) {
      subscription.channel.unsubscribe();
    }
    this.subscriptionManager.subscriptions.clear();

    // Clear cache
    this.cache.clear();

    // Clear timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Convenience functions
export const createOptimizedSubscription = (
  channelName: string,
  config: {
    table: string;
    filter?: string;
    priority?: 'high' | 'medium' | 'low';
    ttl?: number;
  },
  callback: (payload: any) => void
): string => {
  return performanceOptimizer.createOptimizedSubscription(channelName, config, callback);
};

export const unsubscribe = (channelName: string): void => {
  performanceOptimizer.unsubscribe(channelName);
};

export const setCache = <T>(key: string, data: T, ttl?: number): void => {
  performanceOptimizer.setCache(key, data, ttl);
};

export const getCache = <T>(key: string): T | null => {
  return performanceOptimizer.getCache<T>(key);
};

export const batchLoad = <T>(
  keys: string[],
  loader: (keys: string[]) => Promise<Map<string, T>>,
  ttl?: number
): Promise<Map<string, T>> => {
  return performanceOptimizer.batchLoad(keys, loader, ttl);
};

export const debounce = <T extends any[]>(
  key: string,
  func: (...args: T) => void,
  delay?: number
): (...args: T) => void => {
  return performanceOptimizer.debounce(key, func, delay);
};

export const pooledQuery = <T>(
  queryKey: string,
  queryFunc: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  return performanceOptimizer.pooledQuery(queryKey, queryFunc, ttl);
};

export const getPerformanceMetrics = (): PerformanceMetrics => {
  return performanceOptimizer.getMetrics();
};

export const cleanupPerformanceOptimizer = (): void => {
  performanceOptimizer.cleanup();
};