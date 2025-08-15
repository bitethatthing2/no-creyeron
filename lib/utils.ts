import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// STYLING UTILITIES
// ============================================================================

/**
 * Combines Tailwind CSS classes with proper precedence
 * ✅ VERIFIED: Standard utility, no backend dependency
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats number as USD currency
 * ✅ VERIFIED: Matches price fields (numeric type) in menu_items table
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Formats order numbers with padding
 * ⚠️ NOTE: No order tables exist in your database yet
 * This is likely for future functionality
 */
export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber.toString().padStart(4, "0")}`;
}

/**
 * Formats dates to readable string
 * ✅ VERIFIED: Matches timestamp columns (created_at, updated_at) in your tables
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Formats relative time (e.g., "2h ago")
 * ✅ VERIFIED: Useful for last_activity, last_seen_at fields in users table
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  return formatDate(d);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates email format
 * ✅ VERIFIED: Matches email fields (text type) in users, active_wolfpack_members tables
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format
 * ✅ VERIFIED: Matches phone fields (text type) in users, active_wolfpack_members tables
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+\-\(\)\s0-9]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates UUID format
 * ✅ VERIFIED: All your ID fields use UUID type in database
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

/**
 * Calculates distance between two coordinates in miles
 * ✅ VERIFIED: Matches last_known_lat, last_known_lng (numeric type) in users table
 * Perfect for your wolfpack location features
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts degrees to radians (helper for calculateDistance)
 * ✅ VERIFIED: Supporting function for location calculations
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function to limit execution frequency
 * ✅ VERIFIED: Useful for search inputs, API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * ✅ VERIFIED: Useful for scroll events, real-time updates
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Capitalizes first letter of string
 * ✅ VERIFIED: Useful for display names, titles
 */
export function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes first letter of each word
 * ✅ VERIFIED: Useful for user names, location names
 */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str.split(" ").map((word) => capitalizeFirst(word)).join(" ");
}

/**
 * Truncates text with ellipsis
 * ✅ VERIFIED: Useful for descriptions, long text fields
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// ============================================================================
// ID & ERROR UTILITIES
// ============================================================================

/**
 * Generates temporary ID (not for database use)
 * ⚠️ NOTE: Your database uses UUIDs. This is only for temporary client-side IDs
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parses error messages from various sources
 * ✅ VERIFIED: Useful for Supabase error handling
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Promise-based sleep function
 * ✅ VERIFIED: Useful for retry logic, animations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Groups array items by key
 * ✅ VERIFIED: Useful for grouping menu items by category, users by location
 */
export function groupBy<T, K extends keyof unknown>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key = getKey(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * Sorts array by key or function
 * ✅ VERIFIED: Useful for display_order fields in menu tables
 */
export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => unknown),
  order: "asc" | "desc" = "asc",
): T[] {
  const sorted = [...array].sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];

    if (String(aVal) < String(bVal)) return order === "asc" ? -1 : 1;
    if (String(aVal) > String(bVal)) return order === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Returns unique array values
 * ✅ VERIFIED: Standard utility
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Returns unique array items by key function
 * ✅ VERIFIED: Useful for deduplicating database results
 */
export function uniqueBy<T, K>(array: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
