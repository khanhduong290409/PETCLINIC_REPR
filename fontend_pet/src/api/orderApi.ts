import { API_BASE_URL, getAuthHeaders } from './apiClient';

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: string;
  createdAt: string;
  items: OrderItemResponse[];
}

export interface OrderRequest {
  userId: number;
  shippingAddress: string;
  paymentMethod: string;
  notes: string;
  contactPhone: string;
}

export const orderApi = {
  async createOrder(data: OrderRequest): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },

  async getOrders(userId: number): Promise<OrderResponse[]> {
    const response = await fetch(`${API_BASE_URL}/orders?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async getOrderDetail(orderId: number, userId: number): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },
};
