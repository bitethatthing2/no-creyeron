// Re-export database types from the generated file
export type { Database } from './database.types';

// Simple types for the app
export interface User {
  id: string;
  email: string;
  role: string;
  wolfpack_status?: string;
}

export interface WolfpackPost {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

export interface WolfpackComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_active: boolean;      // NEW: For soft deletes (hide from system)
  is_available: boolean;   // EXISTING: For temporary unavailability (out of stock)
  category_id?: string;
}