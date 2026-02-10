import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';

export default function Checkout() {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Vui lòng đăng nhập để thanh toán</p>
          <Link to="/login" className="bg-sky-600 text-white px-6 py-2 rounded-lg">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Giỏ hàng trống
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Giỏ hàng trống</p>
          <Link to="/products" className="text-sky-600 hover:underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shippingAddress.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setLoading(true);

    try {
      const order = await orderApi.createOrder({
        userId: user.id,
        shippingAddress,
        paymentMethod,
        notes,
      });

      // Đặt hàng thành công → Chuyển đến trang chi tiết đơn hàng
      navigate(`/orders/${order.id}`, { state: { justCreated: true } });
    } catch (err) {
      console.error('Failed to create order:', err);
      setError('Không thể tạo đơn hàng. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-6"
      >
        <ArrowLeft size={20} />
        Tiếp tục mua sắm
      </Link>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-6">{error}</div>
      )}

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form thông tin giao hàng - 3 cột */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin người nhận */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin giao hàng</h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Họ tên</label>
                <input
                  type="text"
                  value={user.fullName}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Địa chỉ giao hàng *</label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                />
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Phương thức thanh toán</h2>

              <label className="flex items-center gap-3 p-3 border rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-sky-600"
                />
                <div>
                  <p className="font-semibold">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-sm text-gray-500">Trả tiền mặt khi nhận hàng</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="BANKING"
                  checked={paymentMethod === 'BANKING'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-sky-600"
                />
                <div>
                  <p className="font-semibold">Chuyển khoản ngân hàng</p>
                  <p className="text-sm text-gray-500">Chuyển khoản trước khi giao hàng</p>
                </div>
              </label>
            </div>

            {/* Nút đặt hàng */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : `Đặt hàng (${totalPrice.toLocaleString('vi-VN')}đ)`}
            </button>
          </form>
        </div>

        {/* Tóm tắt đơn hàng - 2 cột */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Đơn hàng ({items.length} sản phẩm)
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold line-clamp-1">{item.product.name}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    <p className="text-sm font-bold text-rose-600">
                      {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-rose-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
