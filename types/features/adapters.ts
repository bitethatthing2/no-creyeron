// Import the main Database type instead of redefining it
import type { Database } from '@/types/database.types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Re-export the Database type instead of redefining it
export type { Database } from '@/types/database.types';

// Export shorthand types for convenience
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];