export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  location_id: 'salem' | 'portland' | 'both';
  social_links?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface Milestone {
  id: string;
  year: string;
  title: string;
  description: string;
  image_url?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  location_id?: 'salem' | 'portland' | 'both';
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  location_id: 'salem' | 'portland' | 'both';
}