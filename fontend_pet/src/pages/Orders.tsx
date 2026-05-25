//lich su don hang
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Star,
  X,
  Clock,
  Loader,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wallet,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import { productReviewApi } from '../api/productReviewApi';
import type { OrderResponse, OrderItemResponse } from '../api/orderApi';
import type { ProductReviewRequest } from '../api/productReviewApi';

// Map trạng thái sang tiếng Việt + màu + icon
const STATUS_MAP: Record<
  string,
  { label: string; badge: string; bar: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Chờ xử lý',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    bar: 'bg-amber-400',
    icon: <Clock size={14} />,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    bar: 'bg-sky-500',
    icon: <Loader size={14} />,
  },
  SHIPPED: {
    label: 'Đang giao',
    badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    bar: 'bg-violet-500',
    icon: <Truck size={14} />,
  },
  DELIVERED: {
    label: 'Đã giao',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    bar: 'bg-emerald-500',
    icon: <CheckCircle2 size={14} />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    bar: 'bg-rose-400',
    icon: <XCircle size={14} />,
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chưa thanh toán', color: 'text-amber-600' },
  PAID: { label: 'Đã thanh toán', color: 'text-emerald-600' },
  FAILED: { label: 'Thanh toán thất bại', color: 'text-rose-600' },
};

type FilterKey = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterKey>('ALL');

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
    try {// lấy tất cả các id product mà user đã đánh giá
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

  // Đếm theo trạng thái (cho stats + filter pills)
  const counts = useMemo(() => {
    const c = { total: 0, active: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) {
      c.total++;
      if (o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'SHIPPED') c.active++;
      else if (o.status === 'DELIVERED') c.delivered++;
      else if (o.status === 'CANCELLED') c.cancelled++;
    }
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    if (filter === 'ACTIVE')
      return orders.filter(
        (o) => o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'SHIPPED'
      );
    if (filter === 'DELIVERED') return orders.filter((o) => o.status === 'DELIVERED');
    if (filter === 'CANCELLED') return orders.filter((o) => o.status === 'CANCELLED');
    return orders;
  }, [orders, filter]);

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

  const FILTER_TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: counts.total },
    { key: 'ACTIVE', label: 'Đang xử lý', count: counts.active },
    { key: 'DELIVERED', label: 'Đã giao', count: counts.delivered },
    { key: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header gradient + thống kê */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <ShoppingBag size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Lịch sử mua hàng
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Đơn hàng của tôi</h1>
                <p className="text-sky-100 text-sm mt-1">
                  Theo dõi trạng thái đơn hàng và đánh giá sản phẩm đã mua
                </p>
              </div>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-sky-700 px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition self-start md:self-auto"
            >
              <Package size={20} /> Tiếp tục mua sắm
            </Link>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard label="Tổng đơn" value={counts.total} icon={<Package size={18} />} />
            <StatCard label="Đang xử lý" value={counts.active} icon={<Truck size={18} />} />
            <StatCard label="Đã giao" value={counts.delivered} icon={<CheckCircle2 size={18} />} />
            <StatCard label="Đã hủy" value={counts.cancelled} icon={<XCircle size={18} />} />
          </div>
        </div>

        {/* Filter pills — chỉ hiện khi có order */}
        {orders.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <FilterPill
                key={tab.key}
                active={filter === tab.key}
                label={tab.label}
                count={tab.count}
                onClick={() => setFilter(tab.key)}
              />
            ))}
          </div>
        )}

        {/* Main content */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
              <Package size={36} className="text-sky-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-1">Chưa có đơn hàng nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Khám phá sản phẩm chăm sóc thú cưng của chúng tôi
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
            >
              <ShoppingBag size={18} /> Mua sắm ngay
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl ring-1 ring-gray-100">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <Package size={28} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">Không có đơn hàng phù hợp</p>
            <p className="text-gray-500 text-sm mb-4">Thử chọn trạng thái khác</p>
            <button
              onClick={() => setFilter('ALL')}
              className="text-sm font-semibold text-sky-600 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = STATUS_MAP[order.status] || {
                label: order.status,
                badge: 'bg-gray-100 text-gray-700',
                bar: 'bg-gray-300',
                icon: <Package size={14} />,
              };
              const paymentStatus =
                PAYMENT_STATUS_MAP[order.paymentStatus] || {
                  label: order.paymentStatus,
                  color: 'text-gray-600',
                };

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
                >
                  {/* Thanh màu trạng thái bên trái */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.bar}`} />

                  <div className="p-5 md:p-6 pl-6 md:pl-7">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-mono mb-1">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.badge}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    {/* Items preview */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-gray-50/70 ring-1 ring-gray-100 rounded-xl px-3 py-2"
                        >
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded-lg ring-1 ring-gray-200 shrink-0 bg-white"
                          />
                          <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                            {item.productName}
                          </span>
                          {order.status === 'DELIVERED' &&
                            (reviewedProductIds.has(item.productId) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                                <CheckCircle2 size={12} /> Đã đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  openReviewModal(item);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition shrink-0"
                              >
                                <Star size={12} /> Đánh giá
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${paymentStatus.color}`}>
                          {order.paymentStatus === 'PAID' ? (
                            <CheckCircle2 size={14} />
                          ) : order.paymentStatus === 'FAILED' ? (
                            <XCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {paymentStatus.label}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          {order.paymentMethod === 'COD' ? (
                            <>
                              <Wallet size={14} /> COD
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} /> Chuyển khoản
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-rose-600 text-lg">
                          {order.totalAmount.toLocaleString('vi-VN')}đ
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </div>
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
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Đánh giá sản phẩm</h2>
                  <button onClick={closeReviewModal} className="p-1 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Tên sản phẩm */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100">
                    <img
                      src={reviewModal.item.productImageUrl}
                      alt={reviewModal.item.productName}
                      className="w-12 h-12 object-cover rounded-lg ring-1 ring-gray-200"
                    />
                    <span className="font-semibold text-gray-800 text-sm">
                      {reviewModal.item.productName}
                    </span>
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
                          <Star
                            size={28}
                            className={
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }
                          />
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
                    <button
                      onClick={closeReviewModal}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Hủy
                    </button>
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
    </div>
  );
}

// Ô thống kê trên header
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/15 backdrop-blur ring-1 ring-white/25 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 text-sky-50 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

// Filter pill theo trạng thái
function FilterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
        active
          ? 'bg-sky-600 text-white shadow-md'
          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-sky-50 hover:text-sky-700'
      }`}
    >
      {label}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
