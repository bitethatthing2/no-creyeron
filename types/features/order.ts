// Order and related types
export interface BartenderOrder {
  id: string;
  table_id: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed';
  items: OrderItem[];
  total: number;
  customerId: string;
  inserted_at: string;
  updated_at?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  notes?: string;
  modifiers?: OrderModifier[];
}

export interface OrderModifier {
  id: string;
  name: string;
  price: number;
}

// Legacy alias for backward compatibility
export type Order = BartenderOrder;