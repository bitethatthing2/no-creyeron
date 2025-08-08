// lib/hooks/useConsistentWolfpackAccess.ts
// Simplified version that matches your existing interface expectations

import { useCallback, useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';

// =============================================================================
// INTERFACE MATCHING YOUR CURRENT USAGE
// =============================================================================

type WolfpackStatusValue = "pending" | "active" | "inactive" | "suspended";

export interface ConsistentWolfpackAccess {
  isMember: boolean;
  isLoading: boolean;
  locationName: string | null;
  error?: string | null;
  canCheckout?: boolean;
  wolfpackStatus?: WolfpackStatusValue | null;
  hasLocationPermission?: boolean;
  refreshData?: () => Promise<void>;
  requestLocationAccess?: () => Promise<void>;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useConsistentWolfpackAccess(): ConsistentWolfpackAccess {
  const [state, setState] = useState<ConsistentWolfpackAccess>({
    isMember: false,
    isLoading: true,
    locationName: null,
    error: null,
    canCheckout: false,
    wolfpackStatus: null,
    hasLocationPermission: false,
  });

  const checkLocationAccess = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth
        .getUser();

      if (authError || !authUser) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Authentication required",
          isMember: false,
        }));
        return;
      }

      // Get user profile data
      console.log(
        "🔍 [WOLFPACK ACCESS] Fetching user profile for auth_id:",
        authUser.id,
      );
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select(`
          id,
          email,
          first_name,
          last_name,
          display_name,
          wolfpack_status,
          is_wolfpack_member,
          wolfpack_tier,
          location_permissions_granted,
          location_id
        `)
        .eq("auth_id", authUser.id)
        .single();

      console.log("👤 [WOLFPACK ACCESS] User profile result:", {
        userProfile,
        userError,
      });
      console.log("🎯 [WOLFPACK ACCESS] Wolfpack status check:", {
        is_wolfpack_member: userProfile?.is_wolfpack_member,
        wolfpack_status: userProfile?.wolfpack_status,
        location_id: userProfile?.location_id,
        email: userProfile?.email,
      });

      if (userError) {
        console.error("❌ [WOLFPACK ACCESS] User profile error:", userError);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Could not fetch user profile",
          isMember: false,
        }));
        return;
      }

      // Check if user is a wolfpack member - proper access control
      const isMember = Boolean(
        userProfile.is_wolfpack_member ||
          userProfile.wolfpack_tier ||
          userProfile.wolfpack_status === "active"
      );

      // Get location information
      let locationName: string | null = null;
      let hasLocationPermission = Boolean(
        userProfile.location_permissions_granted,
      );

      if (userProfile.location_id) {
        const { data: location } = await supabase
          .from("locations")
          .select("name")
          .eq("id", userProfile.location_id)
          .single();

        locationName = location?.name || null;
      }

      // Skip automatic geolocation to avoid browser violations
      // Location will need to be set manually or through user interaction

      // Determine canCheckout
      const canCheckout = isMember &&
        userProfile.wolfpack_status === "active" &&
        hasLocationPermission;

      setState({
        isMember,
        isLoading: false,
        locationName: locationName || "The Side Hustle Bar", // Default fallback
        error: null,
        canCheckout,
        wolfpackStatus: userProfile.wolfpack_status as
          | WolfpackStatusValue
          | null,
        hasLocationPermission,
      });
    } catch (error) {
      console.error("Error checking wolfpack access:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const refreshData = useCallback(async () => {
    await checkLocationAccess();
  }, [checkLocationAccess]);

  const requestLocationAccess = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000,
          });
        },
      );

      const { data: locations } = await supabase
        .from("locations")
        .select("id, name, latitude, longitude, radius_miles")
        .eq("is_active", true);

      if (locations && locations.length > 0) {
        let nearestLocation = null;
        let minDistance = Infinity;

        for (const location of locations) {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            location.latitude,
            location.longitude,
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
          }
        }

        if (
          nearestLocation &&
          minDistance <= (nearestLocation.radius_miles || 0.25)
        ) {
          setState((prev) => ({
            ...prev,
            locationName: nearestLocation.name,
            hasLocationPermission: true,
            canCheckout: prev.isMember && prev.wolfpackStatus === "active",
          }));
        }
      }
    } catch (error) {
      console.warn("Could not get location:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkLocationAccess();
  }, [checkLocationAccess]);

  return {
    ...state,
    refreshData,
    requestLocationAccess,
  };
}

export default useConsistentWolfpackAccess;
