import { API_BASE_URL, getAuthHeaders } from './apiClient';

export interface PaymentLinkResponse {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  paymentStatus: string;
  orderNumber: string;
  transferContent: string;
  accountNumber: string;
  bankName: string;
  amount: number;
}

export const paymentApi = {
  async createPaymentLink(orderId: number): Promise<PaymentLinkResponse> {
    const response = await fetch(`${API_BASE_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ orderId }),
    });
    if (!response.ok) throw new Error('Không thể tạo link thanh toán');
    return response.json();
  },

  async checkStatus(orderCode: number): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/payment/status/${orderCode}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Không thể kiểm tra trạng thái');
    return response.json();
  },
};
