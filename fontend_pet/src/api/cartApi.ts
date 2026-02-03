// Cart API calls
import type { Product } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Response types từ backend
export interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
}

export interface CartItemResponse {
  id: number;
  product: Product;
  quantity: number;
}

export const cartApi = {
  // Lấy giỏ hàng của user
  async getCart(userId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  // Thêm sản phẩm vào giỏ
  async addItem(userId: number, productId: number, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add item to cart');
    return response.json();
  },

  // Cập nhật số lượng
  async updateQuantity(userId: number, productId: number, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${productId}?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
  },

  // Xóa sản phẩm
  async removeItem(userId: number, productId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${productId}?userId=${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove item');
    return response.json();
  },

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear cart');
  },
};
