export type BookingType = 'Table' | 'Party' | 'Catering';

export interface BookingRequest {
  id?: string;
  name: string;
  contact_info: string;
  requested_date: string;
  requested_time: string;
  party_size: number;
  booking_type: BookingType;
  notes?: string;
  location_id: 'salem' | 'portland';
  status?: 'pending' | 'confirmed' | 'rejected';
  created_at?: string;
}