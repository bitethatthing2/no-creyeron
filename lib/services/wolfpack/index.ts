// =============================================================================
// UNIFIED WOLFPACK SERVICE - SINGLE ENTRY POINT
// =============================================================================

// Export types separately using 'export type'
export type {
  ErrorResponse,
  ServiceResponse,
  SuccessResponse,
  WolfpackError,
  UserProfile,
  WolfpackVideo,
  WolfpackComment,
  WolfpackLike,
  DJEvent,
  DJBroadcast,
  EnrichedVideo,
  EnrichedComment,
  ActiveEvent,
  PackMember,
  LocationStats,
  FeedItem,
  FetchFeedResponse,
  LocationInfo,
  GeolocationResult,
  SocialStats,
  CommentReaction,
  PaginationOptions,
  SortOptions,
  WolfpackUser,
  SubscriptionOptions,
} from "./types";


// Export constants
export {
  WOLFPACK_TABLES,
  SIDE_HUSTLE_LOCATIONS,
  SUBSCRIPTION_EVENTS,
  NOTIFICATION_TYPES,
} from "./types";

// Export classes and functions
export {
  AuthenticationError,
  AuthorizationError,
  createErrorResponse,
  createSuccessResponse,
  DatabaseError,
  LocationError,
  logError,
  mapSupabaseError,
  NotFoundError,
  RateLimitError,
  validateEmail,
  validatePagination,
  validateRequired,
  validateUUID,
  ValidationError,
  withErrorHandling,
  WolfpackServiceError,
} from "./errors";

// Export error handler class for backwards compatibility
export { WolfpackServiceError as WolfpackErrorHandler } from "./errors";

// Export individual services
export { WolfpackAuthService } from "./auth";
export { WolfpackFeedService } from "./feed";

// Import all services for unified interface
import { WolfpackAuthService } from "./auth";
import { WolfpackFeedService } from "./feed";

// Temporary imports for legacy service compatibility
import { WolfpackBackendService } from "../wolfpack-backend.service";
import { wolfpackSocialService } from "../wolfpack-social.service";

/**
 * Unified Wolfpack Service - Single interface for all Wolfpack functionality
 *
 * This consolidates all the fragmented Wolfpack services into a single,
 * well-organized service with clear module boundaries.
 *
 * Usage:
 * ```typescript
 * import { WolfpackService } from '@/lib/services/wolfpack';
 *
 * // Authentication
 * const user = await WolfpackService.auth.getCurrentUser();
 *
 * // Feed operations
 * const feed = await WolfpackService.feed.fetchFeedItems();
 *
 * // Social features (coming soon)
 * // const likes = await WolfpackService.social.likePost(postId);
 * ```
 */
export class WolfpackService {
  // Authentication & Authorization
  static auth = WolfpackAuthService;

  // Feed Management
  static feed = WolfpackFeedService;

  // Legacy backend service (temporary compatibility)
  static backend = WolfpackBackendService;

  // Legacy social service (temporary compatibility)
  static social = wolfpackSocialService;

  // Future modules
  // static membership = WolfpackMembershipService;
  // static location = WolfpackLocationService;
  // static events = WolfpackEventsService;
  // static broadcasts = WolfpackBroadcastService;
  // static realtime = WolfpackRealtimeService;

  /**
   * Get service version and health info
   */
  static getServiceInfo() {
    return {
      version: "2.0.0-consolidated",
      phase: "Phase 2 - Service Consolidation",
      status: "In Progress",
      completedModules: ["auth", "feed"],
      pendingModules: [
        "social",
        "membership",
        "location",
        "events",
        "broadcasts",
        "realtime",
      ],
      previousServices: [
        "wolfpack.service.ts",
        "wolfpack-backend.service.ts",
        "wolfpack-enhanced.service.ts",
        "wolfpack-auth.service.ts",
        "wolfpack-social.service.ts",
        "wolfpack-membership.service.ts",
        "wolfpack-location.service.ts",
      ],
    };
  }

  /**
   * Initialize the service (for any setup needed)
   */
  static async initialize() {
    console.log("🐺 Wolfpack Service v2.0 - Consolidated Architecture");
    console.log("📋 Service Info:", this.getServiceInfo());
    return true;
  }
}

// Default export for convenience
export default WolfpackService;

// Legacy compatibility exports (temporary during migration)
export { WolfpackAuthService as LegacyWolfpackAuthService };
export { WolfpackFeedService as LegacyWolfpackFeedService };
export { WolfpackBackendService };
export { wolfpackSocialService };

// Export with uppercase for backward compatibility
export { wolfpackSocialService as WolfpackSocialService };
