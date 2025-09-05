// Types for MENU_ITEMS Edge Function responses
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  price: number;
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  is_active: boolean;
  is_available: boolean;
  featured: boolean;
  tags?: string[];
  ingredients?: string[];
  preparation_time?: number;
  created_at: string;
  updated_at?: string;
  sort_order?: number;
  spice_level?: number;
  prep_time_minutes?: number;
  allergens?: string[];
}

export interface MenuResponse {
  success: boolean;
  data: MenuItem[];
  total_count: number;
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
  error?: string;
}

export interface MenuTypeResponse {
  success: boolean;
  data: Array<{
    type: string;
    count: number;
  }>;
  total: number;
  error?: string;
}

export interface MenuCategoryResponse {
  success: boolean;
  data: Array<{
    category: string;
    count: number;
  }>;
  total: number;
  error?: string;
}

export interface GroupedMenuResponse {
  success: boolean;
  grouped_by: 'type' | 'category';
  groups: Array<{
    name: string;
    items: MenuItem[];
    count: number;
  }>;
  total_groups: number;
  total_items: number;
  error?: string;
}

export interface MenuFilters {
  type?: string;
  category?: string;
  is_active?: boolean;
  is_available?: boolean;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MenuSearchFilters {
  type?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  spice_level?: number;
  prep_time_max?: number;
  allergens_exclude?: string[];
}