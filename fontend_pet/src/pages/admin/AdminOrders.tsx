import { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { adminApi, type AdminOrder } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
};

const ALL_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const PAGE_SIZE = 15;

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag size={24} className="text-sky-600" />
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <span className="ml-auto text-sm text-gray-500">{filtered.length} đơn</span>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Tìm theo mã đơn hoặc tên khách..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 shrink-0">Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <label className="text-sm text-gray-500 shrink-0">Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={handleClearDates}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Xóa bộ lọc ngày"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === '' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tất cả
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === s ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng đơn hàng */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Không có đơn hàng nào</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Tổng tiền</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thanh toán</th>
                <th className="px-4 py-3 text-left">Ngày đặt</th>
                <th className="px-4 py-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{order.userName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenModal(order)}
                      className="text-sky-600 hover:text-sky-800 text-xs font-medium underline"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${currentPage === p ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-mono">{selectedOrder.orderNumber}</p>
                <h2 className="text-lg font-bold text-gray-800">Chi tiết đơn hàng</h2>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Khách hàng</p>
                  <p className="font-medium text-gray-800">{selectedOrder.userName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Ngày đặt</p>
                  <p className="text-gray-700">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Phương thức thanh toán</p>
                  <p className="text-gray-700">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Thanh toán</p>
                  <p className="text-gray-700">{PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus] ?? selectedOrder.paymentStatus}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs mb-0.5">Địa chỉ giao hàng</p>
                  <p className="text-gray-700">{selectedOrder.shippingAddress}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-0.5">Ghi chú</p>
                    <p className="text-gray-700 italic">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Sản phẩm</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.productImageUrl && (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">x{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 shrink-0">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Tổng cộng</span>
                  <span className="text-base font-bold text-sky-700">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Cập nhật trạng thái */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Cập nhật trạng thái giao hàng</p>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || newStatus === selectedOrder.status}
                    className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
