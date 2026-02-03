// Product types
export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string; // Mã danh mục (slug): "food", "accessories", "grooming"
  stock: number;
  description?: string;
  brand?: string;
}
