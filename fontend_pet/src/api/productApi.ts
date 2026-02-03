// Product API calls
import type { Product } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const productApi = {
  // Lấy tất cả sản phẩm
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Lấy sản phẩm theo ID
  async getById(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  // Lấy sản phẩm theo category
  async getByCategory(category: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products?category=${category}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Tìm kiếm sản phẩm
  async search(name: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/search?name=${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },
};
