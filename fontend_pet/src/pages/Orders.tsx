//lich su don hang
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';

// Map trạng thái sang tiếng Việt + màu sắc
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chưa thanh toán', color: 'text-yellow-600' },
  PAID: { label: 'Đã thanh toán', color: 'text-green-600' },
  FAILED: { label: 'Thanh toán thất bại', color: 'text-red-600' },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await orderApi.getOrders(user.id);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Chưa có đơn hàng nào</p>
          <Link to="/products" className="text-sky-600 hover:underline">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
            const paymentStatus = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: 'text-gray-600' };

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white p-5 rounded-lg shadow hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-gray-800">{order.orderNumber}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex gap-2 mb-3">
                  {order.items.slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-500">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${paymentStatus.color}`}>
                    {paymentStatus.label} | {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
                  </span>
                  <span className="font-bold text-rose-600">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
