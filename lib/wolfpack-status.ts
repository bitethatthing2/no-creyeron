// lib/types/wolfpack-status.ts

/**
 * Wolfpack Status Type Definition
 * Based on database constraint: ['pending', 'active', 'inactive', 'suspended']
 *
 * IMPORTANT BACKEND FACTS:
 * - wolfpack_status field in users table (text type, default: 'pending')
 * - is_wolfpack_member field in users table (boolean)
 * - location_verified field in users table (boolean, default: false)
 * - active_wolfpack_members view filters: is_wolfpack_member = true AND status = 'active'
 */

/**
 * Main wolfpack status discriminated union
 * Correctly maps to database wolfpack_status values
 */
export type WolfpackStatus =
  | {
    status: "loading";
    isChecking: true;
    isLoading: true;
    isMember: false;
    isWolfpackMember: false;
    isLocationVerified: false;
  }
  | {
    status: "active";
    isChecking: false;
    isLoading: false;
    isMember: true;
    isWolfpackMember: true;
    isLocationVerified: boolean;
    wolfpackJoinedAt?: string; // Database constraint: must exist when status is 'active'
  }
  | {
    status: "pending";
    isChecking: false;
    isLoading: false;
    isMember: false;
    isWolfpackMember: false;
    isLocationVerified: boolean; // Can be verified even while pending
  }
  | {
    status: "inactive";
    isChecking: false;
    isLoading: false;
    isMember: false;
    isWolfpackMember: false;
    isLocationVerified: boolean; // Retains previous verification status
    wolfpackJoinedAt?: string; // May have joined date from when they were active
  }
  | {
    status: "suspended";
    isChecking: false;
    isLoading: false;
    isMember: false;
    isWolfpackMember: false;
    isLocationVerified: boolean; // Retains verification status
    suspendedAt?: string;
    suspendReason?: string;
  }
  | {
    status: "not_member"; // Client-side state when user has never joined
    isChecking: false;
    isLoading: false;
    isMember: false;
    isWolfpackMember: false;
    isLocationVerified: false;
  };

/**
 * Location verification status
 * Maps to location_verified and location_verification_status fields
 */
export type LocationStatus =
  | {
    status: "loading";
    isChecking: true;
  }
  | {
    status: "verified";
    isChecking: false;
    verifiedAt?: string; // location_verification_date
    method?: string; // location_verification_method
  }
  | {
    status: "not-verified";
    isChecking: false;
  }
  | {
    status: "error";
    isChecking: false;
    error?: string;
  };

/**
 * User status type (separate from wolfpack status)
 * Maps to the 'status' field in users table (default: 'active')
 */
export type UserStatus = "active" | "inactive" | "suspended" | "deleted";

/**
 * Wolfpack tier type
 * Maps to wolfpack_tier field (default: 'basic')
 */
export type WolfpackTier = "basic" | "premium" | "vip" | string;

/**
 * Complete user wolfpack data structure
 * Matches the database schema exactly
 */
export interface WolfpackUserData {
  // Core status fields
  wolfpack_status: "pending" | "active" | "inactive" | "suspended";
  is_wolfpack_member: boolean;
  wolfpack_joined_at: string | null;
  wolfpack_tier: string;

  // Location verification
  location_verified: boolean;
  location_verification_status: string;
  location_verification_date: string | null;
  location_verification_method: string | null;

  // Profile fields
  wolfpack_bio: string | null;
  wolfpack_interests: string[] | null;
  wolfpack_skills: string[] | null;
  wolfpack_availability_status: string | null;
  wolfpack_social_links: Record<string, unknown> | null;
  preferred_pack_activities: string[] | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has wolfpack access
 * Based on active_wolfpack_members view logic:
 * - Must have is_wolfpack_member = true
 * - Must have status = 'active' (user status, not wolfpack_status)
 * - Must have wolfpack_status = 'active'
 */
export function hasWolfpackAccess(status: WolfpackStatus): boolean {
  return status.status === "active" && status.isWolfpackMember === true;
}

/**
 * Check if location is verified
 * Maps to location_verified field in database
 */
export function isLocationVerified(status: WolfpackStatus): boolean {
  return status.isLocationVerified === true;
}

/**
 * Check if user can join wolfpack
 * They can join if they're not already a member and not suspended
 */
export function canJoinWolfpack(status: WolfpackStatus): boolean {
  return (
    status.status === "not_member" ||
    status.status === "pending" ||
    status.status === "inactive"
  );
}

/**
 * Check if user needs to verify location
 * Required for wolfpack features but not for joining
 */
export function needsLocationVerification(status: WolfpackStatus): boolean {
  return !status.isLocationVerified && status.status !== "loading";
}

/**
 * Get display status text for UI
 */
export function getStatusDisplayText(status: WolfpackStatus): string {
  switch (status.status) {
    case "loading":
      return "Checking status...";
    case "active":
      return "Active Wolfpack Member";
    case "pending":
      return "Membership Pending";
    case "inactive":
      return "Inactive Member";
    case "suspended":
      return "Membership Suspended";
    case "not_member":
      return "Not a Member";
    default:
      return "Unknown Status";
  }
}

/**
 * Get status badge color for UI
 */
export function getStatusBadgeColor(status: WolfpackStatus): string {
  switch (status.status) {
    case "active":
      return "green";
    case "pending":
      return "yellow";
    case "inactive":
      return "gray";
    case "suspended":
      return "red";
    case "not_member":
      return "blue";
    case "loading":
    default:
      return "gray";
  }
}

/**
 * Convert database user record to WolfpackStatus
 */
export function userToWolfpackStatus(
  user: Partial<WolfpackUserData> | null,
): WolfpackStatus {
  if (!user) {
    return {
      status: "not_member",
      isChecking: false,
      isLoading: false,
      isMember: false,
      isWolfpackMember: false,
      isLocationVerified: false,
    };
  }

  const wolfpackStatus = user.wolfpack_status || "pending";
  const isLocationVerified = user.location_verified || false;

  switch (wolfpackStatus) {
    case "active":
      // For active status, both isMember and isWolfpackMember must be true
      // This is enforced by the type definition and database logic
      return {
        status: "active",
        isChecking: false,
        isLoading: false,
        isMember: true, // Always true for active status
        isWolfpackMember: true, // Always true for active status
        isLocationVerified,
        wolfpackJoinedAt: user.wolfpack_joined_at || undefined,
      };

    case "pending":
      return {
        status: "pending",
        isChecking: false,
        isLoading: false,
        isMember: false,
        isWolfpackMember: false,
        isLocationVerified,
      };

    case "inactive":
      return {
        status: "inactive",
        isChecking: false,
        isLoading: false,
        isMember: false,
        isWolfpackMember: false,
        isLocationVerified,
        wolfpackJoinedAt: user.wolfpack_joined_at || undefined,
      };

    case "suspended":
      return {
        status: "suspended",
        isChecking: false,
        isLoading: false,
        isMember: false,
        isWolfpackMember: false,
        isLocationVerified,
      };

    default:
      return {
        status: "not_member",
        isChecking: false,
        isLoading: false,
        isMember: false,
        isWolfpackMember: false,
        isLocationVerified: false,
      };
  }
}
