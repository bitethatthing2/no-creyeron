export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;  // Using Date object for better type safety
  location: 'salem' | 'portland' | 'both';
  category: string;
  image: string;
  external_ticket_link?: string;
  featured?: boolean;
  is_cancelled?: boolean;
  price?: number;
}