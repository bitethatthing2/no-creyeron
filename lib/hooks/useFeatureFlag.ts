/**
 * React Hooks for Feature Flags Management
 * Provides typed access to feature flags with loading states, error handling, and caching
 *
 * @module hooks/useFeatureFlags
 */

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

// Type definitions based on your Supabase schema
type FeatureFlag = Database["public"]["Tables"]["feature_flags"]["Row"];

/**
 * Result from checking feature access
 * Matches the structure returned by check_feature_access function
 */
export interface FeatureAccessResult {
  enabled: boolean;
  reason?: string;
  exists?: boolean;
  flag_details?: {
    name: string;
    description: string | null;
    globally_enabled: boolean;
    enabled_roles: string[] | null;
    user_role: string | null;
  };
}

/**
 * Result for single feature flag hook
 */
export interface UseFeatureFlagResult extends FeatureAccessResult {
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Result for multiple feature flags hook
 */
export interface UseMultipleFeatureFlagsResult {
  features: Record<string, FeatureAccessResult>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Admin feature flag management result
 */
export interface UseFeatureFlagAdminResult {
  flags: FeatureFlag[];
  loading: boolean;
  error: Error | null;
  loadAllFlags: () => Promise<void>;
  toggleFeature: (flagName: string, enabled: boolean) => Promise<ToggleResult>;
  updateFeatureFlag: (
    flagName: string,
    updates: Partial<FeatureFlag>,
  ) => Promise<UpdateResult>;
  clearCache: () => void;
}

/**
 * Result from toggling a feature flag
 */
export interface ToggleResult {
  success: boolean;
  error?: string;
  flag?: FeatureFlag;
}

/**
 * Result from updating a feature flag
 */
export interface UpdateResult {
  success: boolean;
  error?: string;
  flag?: FeatureFlag;
}

/**
 * Cache for feature flags to reduce database calls
 */
const featureFlagCache = new Map<string, {
  result: FeatureAccessResult;
  timestamp: number;
  userId?: string;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Service class for feature flag operations
 */
class FeatureFlagsService {
  /**
   * Check if a feature is accessible for a user
   */
  async checkFeatureAccess(
    flagName: string,
    userId?: string,
  ): Promise<FeatureAccessResult> {
    // Check cache first
    const cacheKey = `${flagName}-${userId || "global"}`;
    const cached = featureFlagCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    try {
      const { data, error } = await supabase.rpc("check_feature_access", {
        p_flag_name: flagName,
        p_user_id: userId || null,
      });

      if (error) throw error;

      const result = data as FeatureAccessResult;

      // Cache the result
      featureFlagCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        userId,
      });

      return result;
    } catch (error) {
      console.error("Error checking feature access:", error);
      return {
        enabled: false,
        reason: "Error checking feature access",
        exists: false,
      };
    }
  }

  /**
   * Check multiple features at once
   */
  async checkMultipleFeatures(
    flagNames: string[],
    userId?: string,
  ): Promise<Record<string, FeatureAccessResult>> {
    const results: Record<string, FeatureAccessResult> = {};

    // Check features in parallel
    const promises = flagNames.map(async (flagName) => {
      const result = await this.checkFeatureAccess(flagName, userId);
      return { flagName, result };
    });

    const resolvedResults = await Promise.all(promises);

    resolvedResults.forEach(({ flagName, result }) => {
      results[flagName] = result;
    });

    return results;
  }

  /**
   * Get all feature flags (admin only)
   */
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("flag_name");

    if (error) throw error;
    return data || [];
  }

  /**
   * Toggle a feature flag for testing (admin only)
   */
  async toggleFeatureForTesting(
    flagName: string,
    enabled: boolean,
  ): Promise<ToggleResult> {
    try {
      const { data, error } = await supabase.rpc("toggle_feature_for_testing", {
        p_flag_name: flagName,
        p_enabled: enabled,
      });

      if (error) throw error;

      // Clear cache for this flag
      this.clearFlagCache(flagName);

      return {
        success: true,
        flag: data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle feature",
      };
    }
  }

  /**
   * Update a feature flag (admin only)
   */
  async updateFeatureFlag(
    flagName: string,
    updates: Partial<FeatureFlag>,
  ): Promise<UpdateResult> {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("flag_name", flagName)
        .select()
        .single();

      if (error) throw error;

      // Clear cache for this flag
      this.clearFlagCache(flagName);

      return {
        success: true,
        flag: data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update feature flag",
      };
    }
  }

  /**
   * Clear cache for a specific flag
   */
  clearFlagCache(flagName: string): void {
    // Clear all cache entries for this flag
    for (const key of featureFlagCache.keys()) {
      if (key.startsWith(flagName)) {
        featureFlagCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    featureFlagCache.clear();
  }
}

// Create a singleton instance
export const featureFlagsService = new FeatureFlagsService();

/**
 * Hook to check a single feature flag
 *
 * @param flagName - The name of the feature flag to check
 * @returns Feature flag result with loading and error states
 *
 * @example
 * ```tsx
 * const { enabled, loading, error } = useFeatureFlag('new-chat-ui');
 *
 * if (loading) return <Spinner />;
 * if (enabled) return <NewChatUI />;
 * return <OldChatUI />;
 * ```
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const { user } = useAuth();
  const [result, setResult] = React.useState<FeatureAccessResult>({
    enabled: false,
    reason: "Checking...",
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const checkFeature = React.useCallback(async () => {
    if (!flagName) {
      setResult({ enabled: false, reason: "No flag name provided" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const featureResult = await featureFlagsService.checkFeatureAccess(
        flagName,
        user?.id,
      );

      setResult(featureResult);
    } catch (err: unknown) {
      setError(new Error(err instanceof Error ? err.message : "Failed to check feature flag"));
      setResult({
        enabled: false,
        reason: "Check failed",
        exists: false,
      });
    } finally {
      setLoading(false);
    }
  }, [flagName, user?.id]);

  React.useEffect(() => {
    checkFeature();
  }, [checkFeature]);

  return {
    ...result,
    loading,
    error,
    refresh: checkFeature,
  };
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param flagNames - Array of feature flag names to check
 * @returns Object with feature results, loading, and error states
 *
 * @example
 * ```tsx
 * const { features, loading } = useMultipleFeatureFlags(['chat', 'video', 'voice']);
 *
 * if (features.chat?.enabled) {
 *   // Show chat feature
 * }
 * ```
 */
export function useMultipleFeatureFlags(
  flagNames: string[],
): UseMultipleFeatureFlagsResult {
  const { user } = useAuth();
  const [features, setFeatures] = React.useState<
    Record<string, FeatureAccessResult>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Memoize the flag names to prevent unnecessary re-renders
  const flagNamesKey = flagNames.join(",");
  const memoizedFlagNames = React.useMemo(() => flagNames, [flagNamesKey]);

  const checkFeatures = React.useCallback(async () => {
    if (memoizedFlagNames.length === 0) {
      setFeatures({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await featureFlagsService.checkMultipleFeatures(
        memoizedFlagNames,
        user?.id,
      );

      setFeatures(results);
    } catch (err: unknown) {
      setError(new Error(err instanceof Error ? err.message : "Failed to check feature flags"));

      // Set all features to disabled on error
      const errorResults: Record<string, FeatureAccessResult> = {};
      memoizedFlagNames.forEach((flag) => {
        errorResults[flag] = {
          enabled: false,
          reason: "Check failed",
          exists: false,
        };
      });
      setFeatures(errorResults);
    } finally {
      setLoading(false);
    }
  }, [memoizedFlagNames, user?.id]);

  React.useEffect(() => {
    checkFeatures();
  }, [checkFeatures]);

  return {
    features,
    loading,
    error,
    refresh: checkFeatures,
  };
}

/**
 * Hook for feature flag management (admin only)
 *
 * @returns Admin controls for feature flags
 *
 * @example
 * ```tsx
 * const { flags, toggleFeature, updateFeatureFlag } = useFeatureFlagAdmin();
 *
 * await toggleFeature('new-feature', true);
 * await updateFeatureFlag('new-feature', {
 *   description: 'Updated description',
 *   enabled_for_roles: ['admin', 'user']
 * });
 * ```
 */
export function useFeatureFlagAdmin(): UseFeatureFlagAdminResult {
  const [flags, setFlags] = React.useState<FeatureFlag[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadAllFlags = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allFlags = await featureFlagsService.getAllFeatureFlags();
      setFlags(allFlags);
    } catch (err: unknown) {
      setError(new Error(err instanceof Error ? err.message : "Failed to load feature flags"));
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFeature = React.useCallback(async (
    flagName: string,
    enabled: boolean,
  ): Promise<ToggleResult> => {
    try {
      setError(null);

      const result = await featureFlagsService.toggleFeatureForTesting(
        flagName,
        enabled,
      );

      if (result.success) {
        // Refresh the flags list
        await loadAllFlags();
      } else {
        setError(new Error(result.error || "Failed to toggle feature"));
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle feature";
      setError(new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [loadAllFlags]);

  const updateFeatureFlag = React.useCallback(async (
    flagName: string,
    updates: Partial<FeatureFlag>,
  ): Promise<UpdateResult> => {
    try {
      setError(null);

      const result = await featureFlagsService.updateFeatureFlag(
        flagName,
        updates,
      );

      if (result.success) {
        // Refresh the flags list
        await loadAllFlags();
      } else {
        setError(new Error(result.error || "Failed to update feature flag"));
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update feature flag";
      setError(new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  }, [loadAllFlags]);

  React.useEffect(() => {
    loadAllFlags();
  }, [loadAllFlags]);

  return {
    flags,
    loading,
    error,
    loadAllFlags,
    toggleFeature,
    updateFeatureFlag,
    clearCache: () => featureFlagsService.clearAllCache(),
  };
}

/**
 * Utility hook to check if user has access to specific features
 * Returns boolean for quick conditional rendering
 *
 * @param flagName - The feature flag name to check
 * @returns Boolean indicating if feature is enabled
 *
 * @example
 * ```tsx
 * const hasVideoAccess = useFeatureAccess('video-calls');
 *
 * return hasVideoAccess ? <VideoCall /> : <AudioCall />;
 * ```
 */
export function useFeatureAccess(flagName: string): boolean {
  const { enabled } = useFeatureFlag(flagName);
  return enabled;
}

/**
 * Hook that combines user authentication and feature flag checks
 * Useful for components that need both authentication and feature access
 *
 * @param flagName - The feature flag name to check
 * @returns Combined auth and feature access state
 *
 * @example
 * ```tsx
 * const { user, hasAccess, loading } = useAuthenticatedFeature('premium-chat');
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 * if (!hasAccess) return <UpgradePrompt />;
 * return <PremiumChat />;
 * ```
 */
export function useAuthenticatedFeature(flagName: string) {
  const { user, loading: userLoading } = useAuth();
  const { enabled, loading: flagLoading, error, refresh } = useFeatureFlag(
    flagName,
  );

  return {
    user,
    hasAccess: !!user && enabled,
    loading: userLoading || flagLoading,
    error: !user ? new Error("Authentication required") : error,
    refresh,
  };
}

/**
 * Hook to prefetch feature flags for performance optimization
 * Useful for preloading flags that will be needed soon
 *
 * @param flagNames - Array of feature flag names to prefetch
 *
 * @example
 * ```tsx
 * // In a parent component or route loader
 * usePrefetchFeatureFlags(['chat', 'video', 'voice']);
 * ```
 */
export function usePrefetchFeatureFlags(flagNames: string[]): void {
  const { user } = useAuth();

  React.useEffect(() => {
    if (flagNames.length === 0) return;

    // Prefetch all flags in parallel
    flagNames.forEach((flagName) => {
      featureFlagsService.checkFeatureAccess(flagName, user?.id);
    });
  }, [flagNames.join(","), user?.id]);
}
