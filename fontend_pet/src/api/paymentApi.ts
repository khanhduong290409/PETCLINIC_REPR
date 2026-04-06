// Payment API calls (PayOS)

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

export interface PaymentLinkResponse {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  paymentStatus: string;
}

export const paymentApi = {
  // Tạo link thanh toán PayOS, nhận về QR code
  async createPaymentLink(orderId: number): Promise<PaymentLinkResponse> {
    const response = await fetch(`${API_BASE_URL}/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!response.ok) throw new Error('Không thể tạo link thanh toán');
    return response.json();
  },

  // Kiểm tra trạng thái thanh toán (dùng cho polling)
  async checkStatus(orderCode: number): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/payment/status/${orderCode}`);
    if (!response.ok) throw new Error('Không thể kiểm tra trạng thái');
    return response.json();
  },
};
