/**
 * Avatar Utility Functions
 * 
 * Centralized utilities for handling avatar URLs and fallbacks
 * to prevent code duplication across components.
 */

import { getSmartCacheBustedUrl } from './image-cache';

// Types for avatar sources
interface AvatarSource {
  profile_image_url?: string | null;
  profile_pic_url?: string | null;
  avatar_url?: string | null;
}

interface AvatarOptions {
  fallbackIcon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Default fallback icon
export const DEFAULT_AVATAR_ICON = '/icons/wolf-icon-light-screen.png';

/**
 * Get cache-busted version of default avatar icon
 */
export function getDefaultAvatarIcon(): string {
  return getSmartCacheBustedUrl(DEFAULT_AVATAR_ICON);
}

/**
 * Resolves avatar URL with fallback chain
 * Priority: profile_image_url > profile_pic_url > avatar_url > fallback
 */
export function resolveAvatarUrl(
  source: AvatarSource | string | null | undefined,
  options: AvatarOptions = {}
): string {
  const { fallbackIcon = DEFAULT_AVATAR_ICON } = options;
  
  // Handle string input (direct URL)
  if (typeof source === 'string' && source.trim()) {
    return source;
  }
  
  // Handle null/undefined
  if (!source || typeof source !== 'object') {
    return getSmartCacheBustedUrl(fallbackIcon);
  }
  
  // Apply fallback chain
  const avatarUrl = (
    source.profile_image_url ||
    source.profile_pic_url ||
    source.avatar_url ||
    fallbackIcon
  );
  
  // Apply cache busting to fallback icons only (not user-uploaded images)
  if (avatarUrl === fallbackIcon) {
    return getSmartCacheBustedUrl(avatarUrl);
  }
  
  return avatarUrl;
}

/**
 * Resolves avatar URL specifically for chat contexts
 * Handles message-specific avatar resolution with member fallback
 */
export function resolveChatAvatarUrl(
  messageAvatar?: string | null,
  memberAvatar?: string | null,
  fallback: string = DEFAULT_AVATAR_ICON
): string {
  const avatarUrl = messageAvatar || memberAvatar || fallback;
  
  // Apply cache busting to fallback icons only
  if (avatarUrl === fallback) {
    return getSmartCacheBustedUrl(avatarUrl);
  }
  
  return avatarUrl;
}

/**
 * Resolves avatar URL for wolfpack members
 * Handles the specific pattern used in wolfpack components
 */
export function resolveWolfpackMemberAvatar(
  member: { avatar_url?: string | null } | null | undefined,
  fallback: string = DEFAULT_AVATAR_ICON
): string {
  const avatarUrl = member?.avatar_url || fallback;
  
  // Apply cache busting to fallback icons only
  if (avatarUrl === fallback) {
    return getSmartCacheBustedUrl(avatarUrl);
  }
  
  return avatarUrl;
}

/**
 * Resolves display name with fallback chain
 * Common pattern used alongside avatar resolution
 */
export function resolveDisplayName(
  primaryName?: string | null,
  fallbackName?: string | null,
  defaultName: string = 'Pack Member'
): string {
  return primaryName || fallbackName || defaultName;
}

/**
 * Creates a complete user display object with avatar and name
 * Useful for components that need both avatar and name resolution
 */
export function resolveUserDisplay(
  user: AvatarSource & { display_name?: string | null } | null | undefined,
  options: {
    fallbackName?: string;
    fallbackIcon?: string;
  } = {}
): {
  avatarUrl: string;
  displayName: string;
} {
  const { fallbackName = 'Pack Member', fallbackIcon = DEFAULT_AVATAR_ICON } = options;
  
  return {
    avatarUrl: resolveAvatarUrl(user, { fallbackIcon }),
    displayName: resolveDisplayName(user?.display_name, undefined, fallbackName)
  };
}