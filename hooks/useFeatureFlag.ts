/**
 * React Hook for Feature Flags
 * Provides easy access to feature flags with loading states and error handling
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FeatureAccessResult,
  featureFlagsService,
} from "@/lib/services/feature-flags.service";

interface UseFeatureFlagResult extends FeatureAccessResult {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseMultipleFeatureFlagsResult {
  features: Record<string, FeatureAccessResult>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check a single feature flag
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const { user } = useAuth();
  const [result, setResult] = useState<FeatureAccessResult>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFeature = async () => {
    if (!user?.id) {
      setResult({ enabled: false, reason: "User not authenticated" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const featureResult = await featureFlagsService.checkFeatureAccess(
        flagName,
        user.id,
      );
      setResult(featureResult);
    } catch (err: any) {
      setError(err.message || "Failed to check feature flag");
      setResult({ enabled: false, reason: "Check failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFeature();
  }, [flagName, user?.id]);

  return {
    ...result,
    loading,
    error,
    refresh: checkFeature,
  };
}

/**
 * Hook to check multiple feature flags at once
 */
export function useMultipleFeatureFlags(
  flagNames: string[],
): UseMultipleFeatureFlagsResult {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Record<string, FeatureAccessResult>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFeatures = async () => {
    if (!user?.id || flagNames.length === 0) {
      setFeatures({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await featureFlagsService.checkMultipleFeatures(
        flagNames,
        user.id,
      );
      setFeatures(results);
    } catch (err: any) {
      setError(err.message || "Failed to check feature flags");
      // Set all features to disabled on error
      const errorResults: Record<string, FeatureAccessResult> = {};
      flagNames.forEach((flag) => {
        errorResults[flag] = { enabled: false, reason: "Check failed" };
      });
      setFeatures(errorResults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFeatures();
  }, [flagNames.join(","), user?.id]); // Use join to compare array contents

  return {
    features,
    loading,
    error,
    refresh: checkFeatures,
  };
}

/**
 * Hook for feature flag management (admin only)
 */
export function useFeatureFlagAdmin() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const allFlags = await featureFlagsService.getAllFeatureFlags();
      setFlags(allFlags);
    } catch (err: any) {
      setError(err.message || "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (flagName: string, enabled: boolean) => {
    try {
      setError(null);

      const result = await featureFlagsService.toggleFeatureForTesting(
        flagName,
        enabled,
      );

      if (result.success) {
        // Refresh the flags list
        await loadAllFlags();
        return { success: true };
      } else {
        setError(result.error || "Failed to toggle feature");
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to toggle feature";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    loadAllFlags();
  }, []);

  return {
    flags,
    loading,
    error,
    loadAllFlags,
    toggleFeature,
    clearCache: () => featureFlagsService.clearAllCache(),
  };
}

/**
 * Utility hook to check if user has access to specific features
 * Returns boolean for quick conditional rendering
 */
export function useFeatureAccess(flagName: string): boolean {
  const { enabled } = useFeatureFlag(flagName);
  return enabled;
}

/**
 * Hook that combines user authentication and feature flag checks
 * Useful for components that need both
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
    error: !user ? "Authentication required" : error,
    refresh,
  };
}
