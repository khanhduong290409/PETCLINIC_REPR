import type { Product } from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiClient';

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
  async getCart(userId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  async addItem(userId: number, productId: number, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items?userId=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add item to cart');
    return response.json();
  },

  async updateQuantity(userId: number, productId: number, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${productId}?userId=${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
  },

  async removeItem(userId: number, productId: number): Promise<CartResponse> {
    const response = await fetch(`${API_BASE_URL}/cart/items/${productId}?userId=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove item');
    return response.json();
  },

  async clearCart(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to clear cart');
  },
};
