/**
 * Feature Flags Service
 * Centralizes feature flag checks with caching and error handling
 */

import { supabase } from "@/lib/supabase";

export interface FeatureAccessResult {
  enabled: boolean;
  reason?: string;
  user_role?: string;
  flag_type?: string;
}

export interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  flag_type: string;
  target_role: string;
  description: string;
}

class FeatureFlagsService {
  private supabase = supabase;
  private cache = new Map<
    string,
    { result: FeatureAccessResult; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user has access to a specific feature
   */
  async checkFeatureAccess(
    flagName: string,
    conversationid: string,
    useCache: boolean = true,
  ): Promise<FeatureAccessResult> {
    const cacheKey = `${flagName}-${conversationid}`;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.result;
      }
    }

    try {
      const { data, error } = await this.supabase.rpc("check_feature_access", {
        p_flag_name: flagName,
        p_user_id: conversationid,
      });

      if (error) {
        console.error(`Feature flag check failed for ${flagName}:`, error);
        return { enabled: false, reason: "Feature check failed" };
      }

      const result: FeatureAccessResult = {
        enabled: data?.enabled || false,
        reason: data?.reason,
        user_role: data?.user_role,
        flag_type: data?.flag_type,
      };

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      console.error(`Feature flag service error for ${flagName}:`, error);
      return { enabled: false, reason: "Service unavailable" };
    }
  }

  /**
   * Check multiple features at once
   */
  async checkMultipleFeatures(
    flagNames: string[],
    conversationid: string,
  ): Promise<Record<string, FeatureAccessResult>> {
    const results = await Promise.allSettled(
      flagNames.map((flagName) =>
        this.checkFeatureAccess(flagName, conversationid)
      ),
    );

    const featureMap: Record<string, FeatureAccessResult> = {};

    flagNames.forEach((flagName, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        featureMap[flagName] = result.value;
      } else {
        featureMap[flagName] = {
          enabled: false,
          reason: "Check failed",
        };
      }
    });

    return featureMap;
  }

  /**
   * Toggle feature for testing (admin only)
   */
  async toggleFeatureForTesting(
    flagName: string,
    enabled: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc(
        "toggle_feature_for_testing",
        {
          p_flag_name: flagName,
          p_enabled: enabled,
        },
      );

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear cache for this feature
      this.clearFeatureCache(flagName);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all feature flags (for dashboard)
   */
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await this.supabase
        .from("feature_flag_dashboard")
        .select("*")
        .order("flag_name");

      if (error) {
        console.error("Error fetching feature flags:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Feature flags service error:", error);
      return [];
    }
  }

  /**
   * Clear cache for a specific feature
   */
  clearFeatureCache(flagName: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(`${flagName}-`)
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Feature flag constants for type safety
export const FEATURE_FLAGS = {
  // Video System
  WOLFPACK_VIDEO_UPLOAD: "wolfpack_video_upload",
  WOLFPACK_FOR_YOU_ALGORITHM: "wolfpack_for_you_algorithm",

  // Social Features
  WOLFPACK_FOLLOWING: "wolfpack_following",
  WOLFPACK_DM_SYSTEM: "wolfpack_dm_system",
  WOLFPACK_CHAT_ROOMS: "wolfpack_chat_rooms",
  content_comments: "content_comments",
  WOLFPACK_POST_LIKES: "wolfpack_post_likes",

  // DJ System
  DJ_BROADCAST_SYSTEM: "dj_broadcast_system",
  DJ_EVENT_MANAGEMENT: "dj_event_management",
  DJ_DASHBOARD: "dj_dashboard",

  // Bartender System
  BARTENDER_ORDER_MANAGEMENT: "bartender_order_management",

  // Location Features
  LOCATION_BASED_CONTENT: "location_based_content",
  LOCATION_VERIFICATION: "location_verification",

  // Admin Tools
  ADMIN_MODERATION_TOOLS: "admin_moderation_tools",
  ADMIN_ANALYTICS_DASHBOARD: "admin_analytics_dashboard",
} as const;

// Export singleton instance
export const featureFlagsService = new FeatureFlagsService();
export default featureFlagsService;
