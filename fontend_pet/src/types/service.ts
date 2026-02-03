// Service types
export interface Service {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: number; // minutes
  category: string;
  position?: 'left' | 'right';
}
