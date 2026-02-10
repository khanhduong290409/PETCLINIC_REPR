// Order API calls

const API_BASE_URL = 'http://localhost:8080/api';

export interface OrderItemResponse {
  id: number;
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
}

export const orderApi = {
  // Tạo đơn hàng từ giỏ hàng
  async createOrder(data: OrderRequest): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },

  // Lấy danh sách đơn hàng theo user
  async getOrders(userId: number): Promise<OrderResponse[]> {
    const response = await fetch(`${API_BASE_URL}/orders?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  // Lấy chi tiết 1 đơn hàng
  async getOrderDetail(orderId: number, userId: number): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },
};
