// Common types

// Testimonial (feedback/review)
export interface Testimonial {
  id: number;
  customerName: string;
  petName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string | null;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Feature
export interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
}
