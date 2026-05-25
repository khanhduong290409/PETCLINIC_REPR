import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Clock,
  Loader,
  Truck,
  CheckCircle2,
  XCircle,
  Wallet,
  CreditCard,
  MapPin,
  StickyNote,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import type { OrderResponse } from '../api/orderApi';

const STATUS_MAP: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Chờ xử lý',
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    icon: <Clock size={14} />,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    icon: <Loader size={14} />,
  },
  SHIPPED: {
    label: 'Đang giao',
    badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    icon: <Truck size={14} />,
  },
  DELIVERED: {
    label: 'Đã giao',
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    icon: <CheckCircle2 size={14} />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    icon: <XCircle size={14} />,
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chưa thanh toán', color: 'text-amber-600' },
  PAID: { label: 'Đã thanh toán', color: 'text-emerald-600' },
  FAILED: { label: 'Thanh toán thất bại', color: 'text-rose-600' },
};

// Thứ tự các bước cho timeline
const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-white to-white px-4">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm ring-1 ring-gray-100 max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
            <AlertCircle size={36} className="text-rose-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không tìm thấy đơn hàng</p>
          <p className="text-gray-500 text-sm mb-5">Đơn hàng có thể đã bị xóa hoặc không tồn tại</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
          >
            <ArrowLeft size={18} /> Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || {
    label: order.status,
    badge: 'bg-gray-100 text-gray-700',
    icon: <Package size={14} />,
  };
  const paymentStatus =
    PAYMENT_STATUS_MAP[order.paymentStatus] || {
      label: order.paymentStatus,
      color: 'text-gray-600',
    };

  const currentStepIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Quay lại danh sách đơn hàng
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                  <Package size={28} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                    Chi tiết đơn hàng
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
                    #{order.orderNumber}
                  </h1>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <InfoChip icon={<Clock size={12} />} text={orderDate} />
                    <InfoChip
                      icon={order.paymentMethod === 'COD' ? <Wallet size={12} /> : <CreditCard size={12} />}
                      text={order.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản'}
                    />
                  </div>
                </div>
              </div>

              {/* Status badge to nổi bật */}
              <span
                className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-white ${
                  isCancelled ? 'text-rose-700' : 'text-sky-700'
                } shadow-md`}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Success banner khi vừa đặt hàng */}
        {justCreated && (
          <div className="bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800 p-4 rounded-xl mb-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold">Đặt hàng thành công!</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.
              </p>
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-800 p-4 rounded-xl mb-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="font-bold">Đơn hàng đã bị hủy</p>
              <p className="text-sm text-rose-700 mt-0.5">
                Đơn hàng này không còn được xử lý nữa.
              </p>
            </div>
          </div>
        )}

        {/* Status timeline — ẩn khi CANCELLED */}
        {!isCancelled && (
          <SectionCard icon={<Truck size={18} />} title="Trạng thái đơn hàng">
            <div className="relative flex items-center justify-between">
              {/* Đường nối */}
              <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200" />
              <div
                className="absolute left-5 top-5 h-0.5 bg-sky-500 transition-all"
                style={{
                  width:
                    currentStepIdx > 0
                      ? `calc((100% - 2.5rem) * ${currentStepIdx} / ${STATUS_FLOW.length - 1})`
                      : '0',
                }}
              />
              {STATUS_FLOW.map((step, idx) => {
                const meta = STATUS_MAP[step];
                const reached = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition ${
                        reached ? 'bg-sky-500 shadow-md' : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-sky-100' : ''}`}
                    >
                      {meta.icon}
                    </div>
                    <span
                      className={`text-xs font-semibold text-center ${
                        reached ? 'text-sky-700' : 'text-gray-400'
                      }`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Thông tin giao hàng */}
        <SectionCard icon={<MapPin size={18} />} title="Thông tin giao hàng" className="mt-5">
          <div className="space-y-3">
            <InfoRow
              icon={<MapPin size={16} className="text-sky-600" />}
              label="Địa chỉ"
              value={order.shippingAddress}
            />
            <InfoRow
              icon={
                order.paymentMethod === 'COD' ? (
                  <Wallet size={16} className="text-sky-600" />
                ) : (
                  <CreditCard size={16} className="text-sky-600" />
                )
              }
              label="Thanh toán"
              value={
                <span className="inline-flex items-center gap-2">
                  <span>
                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                  </span>
                  <span className={`text-xs font-semibold ${paymentStatus.color}`}>
                    · {paymentStatus.label}
                  </span>
                </span>
              }
            />
            {order.notes && (
              <InfoRow
                icon={<StickyNote size={16} className="text-amber-600" />}
                label="Ghi chú"
                value={order.notes}
              />
            )}
          </div>
        </SectionCard>

        {/* Sản phẩm */}
        <SectionCard icon={<ShoppingBag size={18} />} title={`Sản phẩm (${order.items.length})`} className="mt-5">
          <div className="space-y-2.5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-gray-50/70 ring-1 ring-gray-100 rounded-xl p-3"
              >
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded-lg ring-1 ring-gray-200 bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 line-clamp-2">{item.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-rose-600 shrink-0">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
              </div>
            ))}
          </div>

          {/* Tổng */}
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 ring-1 ring-rose-100 rounded-xl px-4 py-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">Tổng cộng</span>
              <span className="text-2xl font-extrabold text-rose-600">
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        </SectionCard>

        {/* CTA tiếp tục mua sắm */}
        <div className="text-center mt-6">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-700 transition shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <ShoppingBag size={18} /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}

// Chip thông tin trên header
function InfoChip({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur ring-1 ring-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
      {icon}
      {text}
    </span>
  );
}

// Row info trong card thông tin giao hàng
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50/70 ring-1 ring-gray-100 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
        <div className="text-sm font-medium text-gray-800 mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

// Section card (đơn giản, không có số bước như BookAppointment)
function SectionCard({
  icon,
  title,
  className = '',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden ${className}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500" />
      <div className="p-5 md:p-6 pl-6 md:pl-7">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sky-600">{icon}</span>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
