// Main types barrel export
export * from './features';

// Create the database notification types based on your Supabase schema
export type NotificationRow = {
  id: string;
  recipient_id: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string | null;
};

export type NotificationInsert = Omit<NotificationRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  type?: string;
  status?: string;
  updated_at?: string;
};

export type NotificationUpdate = Partial<NotificationRow>;