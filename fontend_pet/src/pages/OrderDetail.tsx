import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const justCreated = location.state?.justCreated;

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchOrder();
    }
  }, [user, id]);

  const fetchOrder = async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const data = await orderApi.getOrderDetail(Number(id), user.id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại danh sách đơn hàng
      </Link>

      {/* Thông báo đặt hàng thành công */}
      {justCreated && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-3">
          <CheckCircle size={24} />
          <div>
            <p className="font-semibold">Đặt hàng thành công!</p>
            <p className="text-sm">Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Đơn hàng #{order.orderNumber}
          </h1>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p><span className="font-semibold">Ngày đặt:</span>{' '}
              {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            <p><span className="font-semibold">Thanh toán:</span>{' '}
              {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
            </p>
          </div>
          <div>
            <p><span className="font-semibold">Địa chỉ:</span> {order.shippingAddress}</p>
            {order.notes && (
              <p><span className="font-semibold">Ghi chú:</span> {order.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Sản phẩm</h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
              <img
                src={item.productImageUrl}
                alt={item.productName}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  {item.price.toLocaleString('vi-VN')}đ x {item.quantity}
                </p>
              </div>
              <p className="font-bold text-rose-600">
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </p>
            </div>
          ))}
        </div>

        {/* Tổng */}
        <div className="border-t mt-4 pt-4 flex justify-between items-center">
          <span className="text-lg font-semibold">Tổng cộng:</span>
          <span className="text-2xl font-bold text-rose-600">
            {order.totalAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* Nút tiếp tục mua sắm */}
      <div className="text-center">
        <Link
          to="/products"
          className="inline-block bg-sky-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-sky-700 transition"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
