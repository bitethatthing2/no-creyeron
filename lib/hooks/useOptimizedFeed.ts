/**
 * Optimized Wolf Pack Feed Hook
 * High-performance feed for handling many users with virtual scrolling,
 * caching, prefetching, and efficient updates
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface OptimizedVideoItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string;
  likes_count: number;
  wolfpack_comments_count: number;
  view_count: number;
  created_at: string;
  title?: string;
  description?: string;
  duration?: number;
  is_liked?: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    wolf_emoji?: string;
  };
}

interface FeedCache {
  [key: string]: {
    data: OptimizedVideoItem[];
    timestamp: number;
    cursor?: string;
  };
}

interface UseOptimizedFeedProps {
  pageSize?: number;
  cacheTimeout?: number; // ms
  prefetchPages?: number;
  enableVirtualization?: boolean;
}

interface UseOptimizedFeedReturn {
  wolfpack_videos: OptimizedVideoItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  updatewolfpack_videostats: (
    videoId: string,
    updates: Partial<OptimizedVideoItem>,
  ) => void;
  getVisibleRange: () => { start: number; end: number };
  totalCount: number;
  cacheStats: { hits: number; misses: number; size: number };
}

// In-memory cache with LRU eviction
class FeedCacheManager {
  private cache: FeedCache = {};
  private accessOrder: string[] = [];
  private maxSize = 50; // Maximum cached pages
  private hits = 0;
  private misses = 0;

  get(key: string, timeout: number): OptimizedVideoItem[] | null {
    const cached = this.cache[key];
    if (!cached) {
      this.misses++;
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > timeout) {
      this.delete(key);
      this.misses++;
      return null;
    }

    // Update access order
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
    this.hits++;

    return cached.data;
  }

  set(key: string, data: OptimizedVideoItem[], cursor?: string): void {
    // Evict LRU if at capacity
    if (Object.keys(this.cache).length >= this.maxSize && !this.cache[key]) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        delete this.cache[lruKey];
      }
    }

    this.cache[key] = {
      data,
      timestamp: Date.now(),
      cursor,
    };

    // Update access order
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  delete(key: string): void {
    delete this.cache[key];
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
  }

  clear(): void {
    this.cache = {};
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      size: Object.keys(this.cache).length,
    };
  }
}

// Singleton cache instance
const feedCache = new FeedCacheManager();

export function useOptimizedFeed({
  pageSize = 20,
  cacheTimeout = 5 * 60 * 1000, // 5 minutes
  prefetchPages = 2,
  enableVirtualization = true,
}: UseOptimizedFeedProps = {}): UseOptimizedFeedReturn {
  const [wolfpack_videos, setwolfpack_videos] = useState<OptimizedVideoItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const visibleRangeRef = useRef({ start: 0, end: pageSize });
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Optimized feed fetch with caching
  const fetchFeedPage = useCallback(
    async (page: number, append = false): Promise<OptimizedVideoItem[]> => {
      const cacheKey = `feed-page-${page}`;

      // Try cache first
      const cached = feedCache.get(cacheKey, cacheTimeout);
      if (cached && !append) {
        console.log(`[FEED] Cache hit for page ${page}`);
        return cached;
      }

      console.log(`[FEED] Cache miss - fetching page ${page}`);

      try {
        const offset = page * pageSize;

        // Optimized query with selective fields and proper joins
        const { data, error, count } = await supabase
          .from("wolfpack_videos")
          .select(
            `
          id,
          user_id,
          title,
          description,
          video_url,
          thumbnail_url,
          like_count,
          wolfpack_comments_count,
          view_count,
          created_at,
          duration,
          user:users!user_id(
            id,
            username,
            display_name,
            avatar_url,
            wolf_emoji
          )
        `,
            { count: "exact" },
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error(`[FEED] Error fetching page ${page}:`, error);
          throw error;
        }

        // Transform data
        const transformedwolfpack_videos: OptimizedVideoItem[] = (data || [])
          .map((item) => ({
            id: item.id,
            user_id: item.user_id,
            username: item.user?.display_name || item.user?.username ||
              "Anonymous",
            avatar_url: item.user?.avatar_url,
            caption: item.description || item.title || "",
            video_url: item.video_url,
            thumbnail_url: item.thumbnail_url,
            likes_count: item.like_count || 0,
            wolfpack_comments_count: item.wolfpack_comments_count || 0,
            view_count: item.view_count || 0,
            created_at: item.created_at,
            title: item.title,
            description: item.description,
            duration: item.duration,
            user: item.user,
          }));

        // Cache the result
        feedCache.set(cacheKey, transformedwolfpack_videos);

        // Update total count
        if (count !== null) {
          setTotalCount(count);
        }

        return transformedwolfpack_videos;
      } catch (err: any) {
        console.error(`[FEED] Error fetching page ${page}:`, err);
        throw new Error(`Failed to fetch feed: ${err.message}`);
      }
    },
    [pageSize, cacheTimeout],
  );

  // Prefetch upcoming pages
  const prefetchPages = useCallback(async (fromPage: number) => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(async () => {
      try {
        const prefetchPromises = [];
        for (let i = 1; i <= prefetchPages; i++) {
          const pageToFetch = fromPage + i;
          prefetchPromises.push(fetchFeedPage(pageToFetch));
        }
        await Promise.all(prefetchPromises);
        console.log(
          `[FEED] Prefetched ${prefetchPages} pages starting from ${
            fromPage + 1
          }`,
        );
      } catch (error) {
        console.warn("[FEED] Prefetch failed:", error);
      }
    }, 100); // Small delay to batch prefetch requests
  }, [fetchFeedPage, prefetchPages]);

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const initialwolfpack_videos = await fetchFeedPage(0);

      if (mountedRef.current) {
        setwolfpack_videos(initialwolfpack_videos);
        setCurrentPage(0);
        setHasMore(initialwolfpack_videos.length === pageSize);

        // Start prefetching
        if (initialwolfpack_videos.length > 0) {
          prefetchPages(0);
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFeedPage, pageSize, prefetchPages]);

  // Load more wolfpack_videos
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !mountedRef.current) return;

    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const newwolfpack_videos = await fetchFeedPage(nextPage, true);

      if (mountedRef.current) {
        setwolfpack_videos((prev) => [...prev, ...newwolfpack_videos]);
        setCurrentPage(nextPage);
        setHasMore(newwolfpack_videos.length === pageSize);

        // Continue prefetching
        if (newwolfpack_videos.length > 0) {
          prefetchPages(nextPage);
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [
    currentPage,
    hasMore,
    loadingMore,
    fetchFeedPage,
    pageSize,
    prefetchPages,
  ]);

  // Refresh feed (clear cache)
  const refreshFeed = useCallback(async () => {
    feedCache.clear();
    setCurrentPage(0);
    await loadInitialFeed();
  }, [loadInitialFeed]);

  // Update video stats optimistically
  const updatewolfpack_videostats = useCallback(
    (videoId: string, updates: Partial<OptimizedVideoItem>) => {
      setwolfpack_videos((prev) =>
        prev.map((video) =>
          video.id === videoId ? { ...video, ...updates } : video
        )
      );
    },
    [],
  );

  // Virtual scrolling support
  const getVisibleRange = useCallback(() => {
    return visibleRangeRef.current;
  }, []);

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    if (!mountedRef.current) return;

    const setupRealtime = () => {
      const channel = supabase
        .channel(`optimized_feed_${Date.now()}`, {
          config: { presence: { key: "user_id" } },
        })
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "wolfpack_videos",
          filter: "is_active=eq.true",
        }, (payload) => {
          console.log("[FEED REALTIME] New video:", payload);
          // Invalidate cache and refresh if we're at the top
          if (currentPage === 0) {
            feedCache.delete("feed-page-0");
            refreshFeed();
          }
        })
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "wolfpack_videos",
        }, (payload) => {
          console.log("[FEED REALTIME] Video updated:", payload);
          if (payload.new.id) {
            updatewolfpack_videostats(payload.new.id, {
              likes_count: payload.new.like_count,
              wolfpack_comments_count: payload.new.wolfpack_comments_count,
              view_count: payload.new.view_count,
            });
          }
        })
        .subscribe((status) => {
          console.log("[FEED REALTIME] Status:", status);
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [currentPage, refreshFeed, updatewolfpack_videostats]);

  // Initialize feed on mount
  useEffect(() => {
    loadInitialFeed();

    return () => {
      mountedRef.current = false;
    };
  }, [loadInitialFeed]);

  const cacheStats = useMemo(() => feedCache.getStats(), [wolfpack_videos]);

  return {
    wolfpack_videos,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refreshFeed,
    updatewolfpack_videostats,
    getVisibleRange,
    totalCount,
    cacheStats,
  };
}
