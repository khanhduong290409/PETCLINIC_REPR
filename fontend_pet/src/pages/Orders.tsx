//lich su don hang
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Star, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import { productReviewApi } from '../api/productReviewApi';
import type { OrderResponse, OrderItemResponse } from '../api/orderApi';
import type { ProductReviewRequest } from '../api/productReviewApi';

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
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set());

  // State modal đánh giá sản phẩm
  const [reviewModal, setReviewModal] = useState<{ item: OrderItemResponse } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchReviewedProductIds();
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

  const fetchReviewedProductIds = async () => {
    if (!user) return;
    try {
      const ids = await productReviewApi.getReviewedProductIds(user.id);
      setReviewedProductIds(new Set(ids));
    } catch (err) {
      console.error('Failed to fetch reviewed product ids:', err);
    }
  };

  const openReviewModal = (item: OrderItemResponse) => {
    setReviewModal({ item });
    setReviewRating(5);
    setReviewComment('');
  };

  const closeReviewModal = () => {
    setReviewModal(null);
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewModal) return;
    setReviewSubmitting(true);
    try {
      const data: ProductReviewRequest = {
        userId: user.id,
        productId: reviewModal.item.productId,
        rating: reviewRating,
        comment: reviewComment,
      };
      await productReviewApi.createReview(data);
      setReviewedProductIds((prev) => new Set([...prev, reviewModal.item.productId]));
      closeReviewModal();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setReviewSubmitting(false);
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
                <div className="flex flex-col gap-2 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded border shrink-0"
                      />
                      <span className="text-sm text-gray-700 flex-1 truncate">{item.productName}</span>
                      {order.status === 'DELIVERED' && (
                        reviewedProductIds.has(item.productId) ? (
                          <span className="text-xs text-green-600 font-medium shrink-0">✓ Đã đánh giá</span>
                        ) : (
                          <button
                            onClick={(e) => { e.preventDefault(); openReviewModal(item); }}
                            className="text-xs text-amber-500 hover:text-amber-700 font-medium shrink-0"
                          >
                            ⭐ Đánh giá
                          </button>
                        )
                      )}
                    </div>
                  ))}
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

      {/* ===== MODAL ĐÁNH GIÁ SẢN PHẨM ===== */}
      {reviewModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closeReviewModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Đánh giá sản phẩm</h2>
                <button onClick={closeReviewModal} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Tên sản phẩm */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <img src={reviewModal.item.productImageUrl} alt={reviewModal.item.productName} className="w-12 h-12 object-cover rounded" />
                  <span className="font-semibold text-gray-800 text-sm">{reviewModal.item.productName}</span>
                </div>
                {/* Chọn sao */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Mức độ hài lòng</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`text-3xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}
                      >
                        <Star size={28} className={star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Comment */}
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1 block">Nhận xét</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm về sản phẩm..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeReviewModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Hủy</button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || !reviewComment.trim()}
                    className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50 text-sm"
                  >
                    {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
