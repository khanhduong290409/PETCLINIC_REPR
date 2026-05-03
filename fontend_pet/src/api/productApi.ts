// Product API calls
import type { Product } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;
const CLOUDINARY_CLOUD_NAME = 'dm1xwivqn';
const CLOUDINARY_UPLOAD_PRESET = 'v5nd8djy';

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

  // --- Admin ---

  // Tạo sản phẩm mới
  async create(data: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  // Cập nhật sản phẩm
  async update(id: number, data: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  // Xóa sản phẩm
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },

  // Cập nhật tồn kho
  async updateStock(id: number, stock: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });
    if (!response.ok) throw new Error('Failed to update stock');
    return response.json();
  },

  // Upload ảnh sản phẩm lên Cloudinary
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'PetsClinic/Products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.secure_url;
  },
};
