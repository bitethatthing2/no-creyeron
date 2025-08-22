export interface MerchItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;  // Changed from imageUrl to match mock data
  category_id: string;
  in_stock: boolean;  // Changed from available to match mock data
  location?: 'salem' | 'portland' | 'both';  // Added location field
  popular?: boolean;
  variants?: MerchVariant[];
  metadata?: Record<string, unknown>;
}

export interface MerchVariant {
  id: string;
  name: string;
  price_adjustment: number;
  options: string[];  // Size/color options
  available: boolean;
}

export interface MerchCategory {
  id: string;
  name: string;
  display_order?: number;
  description?: string;
}