import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  X,
  Search,
  Calendar,
  Clock,
  Loader,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CreditCard,
  MapPin,
  StickyNote,
  User,
  Eye,
} from 'lucide-react';
import { adminApi, type AdminOrder } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

// Badge style + icon cho từng status (đồng bộ với user-facing Orders page)
const STATUS_META: Record<
  string,
  { badge: string; icon: React.ReactNode }
> = {
  PENDING: {
    badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    icon: <Clock size={12} />,
  },
  PROCESSING: {
    badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    icon: <Loader size={12} />,
  },
  SHIPPED: {
    badge: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    icon: <Truck size={12} />,
  },
  DELIVERED: {
    badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
    icon: <XCircle size={12} />,
  },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-600',
  PAID: 'text-emerald-600',
  FAILED: 'text-rose-600',
};

const ALL_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const PAGE_SIZE = 9;

function formatCurrency(amount: number) {
  return amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrders() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllOrders();
      setOrders(data);
    } catch {
      showToast('Không thể tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setNewStatus('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || newStatus === selectedOrder.status) return;
    try {
      setUpdating(true);
      const updated = await adminApi.updateOrderStatus(selectedOrder.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(updated);
      showToast(`Đã cập nhật trạng thái thành "${STATUS_LABEL[newStatus]}"`);
      handleCloseModal();

    } catch {
      showToast('Cập nhật thất bại', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === '' || o.status === filterStatus;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.toLowerCase().includes(search.toLowerCase());
    // So sánh chỉ phần ngày (YYYY-MM-DD) để tránh lệch timezone
    const orderDate = o.createdAt.slice(0, 10);
    const matchFrom = dateFrom === '' || orderDate >= dateFrom;
    const matchTo = dateTo === '' || orderDate <= dateTo;
    return matchStatus && matchSearch && matchFrom && matchTo;
  });
  /** const orderDate = o.createdAt.slice(0, 10);
Backend trả về createdAt dạng chuỗi ISO 8601:
"2026-05-09T14:30:25"
 0123456789          ← index
 .slice(0, 10)Cắt chuỗi từ index 0 đến 9 (không lấy index 10):
"2026-05-09T14:30:25"
 ^^^^^^^^^^
 0         10
→ "2026-05-09"Kết quả chỉ còn phần ngày theo định dạng YYYY-MM-DD
   */

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleDateFromChange = (val: string) => {
    setDateFrom(val);
    setCurrentPage(1);
  };

  const handleDateToChange = (val: string) => {
    setDateTo(val);
    setCurrentPage(1);
  };

  const handleClearDates = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Đếm theo status cho filter pills
  const counts = ALL_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Hiển thị <span className="font-semibold text-gray-700">{filtered.length}</span>/<span className="font-semibold text-gray-700">{orders.length}</span> đơn hàng
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: search + date filter */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Mã đơn hoặc tên khách hàng..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Từ ngày
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="border border-gray-200 rounded-xl pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Đến ngày
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="border border-gray-200 rounded-xl pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {(dateFrom || dateTo) && (
            <button
              onClick={handleClearDates}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition mb-0"
              title="Xóa bộ lọc ngày"
            >
              <X size={14} /> Xóa ngày
            </button>
          )}
        </div>
      </div>

      {/* Filter pills theo status */}
      <div className="flex gap-2 flex-wrap">
        <FilterPill
          active={filterStatus === ''}
          label="Tất cả"
          count={orders.length}
          onClick={() => handleFilterChange('')}
        />
        {ALL_STATUSES.map((s) => (
          <FilterPill
            key={s}
            active={filterStatus === s}
            label={STATUS_LABEL[s]}
            count={counts[s] || 0}
            onClick={() => handleFilterChange(s)}
          />
        ))}
      </div>

      {/* Table card */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 text-center text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto mb-3" />
          Đang tải...
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <ShoppingBag size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Không có đơn hàng nào</p>
          <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc xóa các điều kiện tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Mã đơn</th>
                  <th className="px-4 py-3 text-left font-bold">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-bold">Tổng tiền</th>
                  <th className="px-4 py-3 text-left font-bold">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-bold">Thanh toán</th>
                  <th className="px-4 py-3 text-left font-bold">Ngày đặt</th>
                  <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((order) => {
                  const meta = STATUS_META[order.status] || {
                    badge: 'bg-gray-100 text-gray-700',
                    icon: null,
                  };
                  return (
                    <tr key={order.id} className="hover:bg-sky-50/30 transition">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800 whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700 inline-flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        {order.userName}
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600 whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>
                          {meta.icon}
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        <span className={PAYMENT_STATUS_COLOR[order.paymentStatus] || 'text-gray-600'}>
                          {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenModal(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                        >
                          <Eye size={13} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-500">
                Hiển thị <span className="font-semibold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-gray-700">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  <ChevronLeft size={14} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                      currentPage === p
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50 hover:border-sky-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition"
                >
                  Sau <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header gradient */}
            <div className="relative bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-sky-100 font-mono">#{selectedOrder.orderNumber}</p>
                <h2 className="text-lg font-bold text-white">Chi tiết đơn hàng</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Status hiện tại */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Trạng thái hiện tại
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_META[selectedOrder.status]?.badge || 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_META[selectedOrder.status]?.icon}
                  {STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}
                </span>
              </div>

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBox
                  icon={<User size={14} className="text-sky-600" />}
                  label="Khách hàng"
                  value={selectedOrder.userName}
                />
                <InfoBox
                  icon={<Calendar size={14} className="text-sky-600" />}
                  label="Ngày đặt"
                  value={formatDate(selectedOrder.createdAt)}
                />
                <InfoBox
                  icon={selectedOrder.paymentMethod === 'COD' ? <Wallet size={14} className="text-sky-600" /> : <CreditCard size={14} className="text-sky-600" />}
                  label="Phương thức"
                  value={selectedOrder.paymentMethod === 'COD' ? 'Thanh toán khi nhận' : 'Chuyển khoản'}
                />
                <InfoBox
                  icon={<CheckCircle2 size={14} className={PAYMENT_STATUS_COLOR[selectedOrder.paymentStatus] || 'text-gray-500'} />}
                  label="Thanh toán"
                  value={PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus] ?? selectedOrder.paymentStatus}
                  valueClass={PAYMENT_STATUS_COLOR[selectedOrder.paymentStatus]}
                />
                <InfoBox
                  className="col-span-2"
                  icon={<MapPin size={14} className="text-sky-600" />}
                  label="Địa chỉ giao hàng"
                  value={selectedOrder.shippingAddress}
                />
                {selectedOrder.notes && (
                  <InfoBox
                    className="col-span-2"
                    icon={<StickyNote size={14} className="text-amber-600" />}
                    label="Ghi chú"
                    value={selectedOrder.notes}
                    italic
                  />
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">
                  Sản phẩm ({selectedOrder.items.length})
                </p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-gray-50/70 ring-1 ring-gray-100 rounded-xl p-2.5"
                    >
                      {item.productImageUrl && (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200 bg-white shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">x{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-rose-600 shrink-0">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tổng cộng */}
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 ring-1 ring-rose-100 rounded-xl px-4 py-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Tổng cộng</span>
                    <span className="text-xl font-extrabold text-rose-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cập nhật trạng thái */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">
                  Cập nhật trạng thái giao hàng
                </p>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || newStatus === selectedOrder.status}
                    className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    {updating ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter pill
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

// Info row trong modal
function InfoBox({
  icon,
  label,
  value,
  italic,
  valueClass,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  italic?: boolean;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={`bg-gray-50/60 ring-1 ring-gray-100 rounded-lg px-3 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
        {icon}
        <span className="uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className={`text-sm font-medium text-gray-800 ${italic ? 'italic' : ''} ${valueClass || ''}`}>
        {value}
      </p>
    </div>
  );
}
