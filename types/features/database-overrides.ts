
// Database type overrides to handle schema changes
export interface DatabaseOverrides {
  // Override for any remaining type conflicts
  [key: string]: unknown;
}

// Export clean types for commonly used interfaces
export interface CleanUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  wolf_emoji?: string | null;
  is_wolfpack_member?: boolean | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface CleanRestaurantTable {
  id: string;
  table_number: number;
  is_active: boolean;
  location_id?: string | null;
}

// Re-export with clean types
export type { Database } from '@/types/database.types';
