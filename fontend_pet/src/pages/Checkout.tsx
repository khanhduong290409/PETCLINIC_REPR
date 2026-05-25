import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Wallet,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  StickyNote,
  User,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import PaymentQRModal from '../components/PaymentQRModal';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State cho QR modal (chỉ dùng khi chọn BANKING)
  const [qrModal, setQrModal] = useState<{
    orderId: number;
    orderCode: number;
    qrCode: string;
    orderNumber: string;
    transferContent: string;
    accountNumber: string;
    bankName: string;
    amount: number;
  } | null>(null);

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

  // Giỏ hàng trống — không hiển thị khi đang show QR modal
  if (items.length === 0 && !qrModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50/60 via-white to-white px-4">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm ring-1 ring-gray-100 max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-sky-50 flex items-center justify-center">
            <ShoppingBag size={36} className="text-sky-500" />
          </div>
          <p className="text-gray-700 text-lg font-semibold mb-1">Giỏ hàng trống</p>
          <p className="text-gray-500 text-sm mb-5">Hãy thêm sản phẩm vào giỏ trước khi thanh toán</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contactPhone.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!shippingAddress.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const order = await orderApi.createOrder({
        userId: user.id,
        shippingAddress,
        paymentMethod,
        notes,
        contactPhone: contactPhone.trim(),
      });

      if (paymentMethod === 'BANKING') {
        // Tạo QR PayOS rồi hiển thị modal, chưa xóa giỏ hàng
        const paymentLink = await paymentApi.createPaymentLink(order.id);
        clearCart();
        setQrModal({
          orderId: order.id,
          orderCode: paymentLink.orderCode,
          qrCode: paymentLink.qrCode,
          orderNumber: paymentLink.orderNumber,
          transferContent: paymentLink.transferContent,
          accountNumber: paymentLink.accountNumber,
          bankName: paymentLink.bankName,
          amount: paymentLink.amount,
        });
      } else {
        // COD: xóa giỏ hàng rồi chuyển trang luôn
        clearCart();
        navigate(`/orders/${order.id}`, { state: { justCreated: true } });
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      setError('Không thể tạo đơn hàng. Vui lòng thử lại.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
    }
  };

  // Bước nào đã hoàn thành — cho step indicator + viền card
  const stepDone = {
    shipping: contactPhone.trim().length > 0 && shippingAddress.trim().length > 0,
    payment: paymentMethod.length > 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Tiếp tục mua sắm
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <ShoppingBag size={28} className="text-white" />
              </div>
              <div>
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Hoàn tất đơn hàng
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Thanh toán</h1>
                <p className="text-sky-100 text-sm mt-1">
                  Điền thông tin giao hàng, chọn phương thức thanh toán và xác nhận đơn
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="relative grid grid-cols-2 gap-2 mt-6">
              <StepChip num={1} label="Thông tin giao hàng" done={stepDone.shipping} />
              <StepChip num={2} label="Phương thức thanh toán" done={stepDone.payment} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-3.5 rounded-xl mb-4 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-6">
          {/* Form - 3 cột */}
          <div className="md:col-span-3">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Thông tin giao hàng */}
              <SectionCard
                num={1}
                icon={<Truck size={18} />}
                title="Thông tin giao hàng"
                hint={stepDone.shipping ? '✓ Đã điền' : 'Bắt buộc'}
                active={stepDone.shipping}
              >
                {/* Họ tên */}
                <div className="mb-4">
                  <label className="text-gray-700 mb-1.5 text-sm font-semibold flex items-center gap-1.5">
                    <User size={14} /> Họ tên
                  </label>
                  <input
                    type="text"
                    value={user.fullName}
                    disabled
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>

                {/* SĐT */}
                <div className="mb-4">
                  <label className="text-gray-700 mb-1.5 text-sm font-semibold flex items-center gap-1.5">
                    <Phone size={14} /> Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    placeholder="Số điện thoại để shipper liên hệ"
                    required
                  />
                  {!user.phone && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Bạn chưa lưu số điện thoại.{' '}
                        <a href="/profile" className="underline font-semibold hover:text-amber-800">
                          Cập nhật hồ sơ
                        </a>{' '}
                        để tự động điền lần sau.
                      </span>
                    </p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="mb-4">
                  <label className="text-gray-700 mb-1.5 text-sm font-semibold flex items-center gap-1.5">
                    <MapPin size={14} /> Địa chỉ giao hàng *
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    required
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-gray-700 mb-1.5 text-sm font-semibold flex items-center gap-1.5">
                    <StickyNote size={14} /> Ghi chú
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                  />
                </div>
              </SectionCard>

              {/* Section 2: Phương thức thanh toán */}
              <SectionCard
                num={2}
                icon={<Wallet size={18} />}
                title="Phương thức thanh toán"
                hint={paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản'}
                active={stepDone.payment}
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* COD */}
                  <label
                    className={`relative flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === 'COD'
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === 'COD' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Wallet size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">Thanh toán khi nhận hàng</p>
                      <p className="text-xs text-gray-500 mt-0.5">Trả tiền mặt khi nhận hàng (COD)</p>
                    </div>
                    {paymentMethod === 'COD' && (
                      <CheckCircle size={20} className="text-sky-500 shrink-0" />
                    )}
                  </label>

                  {/* BANKING */}
                  <label
                    className={`relative flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                      paymentMethod === 'BANKING'
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="BANKING"
                      checked={paymentMethod === 'BANKING'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === 'BANKING' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <CreditCard size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">Chuyển khoản ngân hàng</p>
                      <p className="text-xs text-gray-500 mt-0.5">Quét QR PayOS, chuyển khoản nhanh</p>
                    </div>
                    {paymentMethod === 'BANKING' && (
                      <CheckCircle size={20} className="text-sky-500 shrink-0" />
                    )}
                  </label>
                </div>
              </SectionCard>
            </form>
          </div>

          {/* Tóm tắt đơn hàng - 2 cột */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden sticky top-24">
              {/* Header gradient */}
              <div className="bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-4">
                <div className="flex items-center gap-2 text-white">
                  <ShoppingBag size={20} />
                  <h2 className="text-lg font-bold">Đơn hàng ({items.length})</h2>
                </div>
              </div>

              <div className="p-5">
                {/* Items list */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3 bg-gray-50/70 ring-1 ring-gray-100 rounded-xl p-2.5"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg ring-1 ring-gray-200 bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                          {item.product.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">SL: {item.quantity}</span>
                          <span className="text-sm font-bold text-rose-600">
                            {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 mt-4" />

                {/* Tổng */}
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 ring-1 ring-rose-100 rounded-xl px-4 py-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-rose-600">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Submit button — gắn vào form qua attribute form="checkout-form" */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading}
                  className="w-full mt-4 bg-sky-600 text-white py-3 rounded-xl font-semibold hover:bg-sky-700 active:scale-[0.99] transition shadow-md disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản dịch vụ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Modal — hiển thị khi user chọn BANKING */}
        {qrModal && (
          <PaymentQRModal
            orderId={qrModal.orderId}
            orderCode={qrModal.orderCode}
            qrCode={qrModal.qrCode}
            orderNumber={qrModal.orderNumber}
            transferContent={qrModal.transferContent}
            accountNumber={qrModal.accountNumber}
            bankName={qrModal.bankName}
            amount={qrModal.amount}
            onClose={() => {
              setQrModal(null);
              navigate(`/orders/${qrModal.orderId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Step chip trên header
function StepChip({ num, label, done }: { num: number; label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ring-1 transition ${
        done
          ? 'bg-white/25 ring-white/40 text-white'
          : 'bg-white/10 ring-white/20 text-sky-50'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          done ? 'bg-white text-sky-700' : 'bg-white/30 text-white'
        }`}
      >
        {done ? '✓' : num}
      </span>
      <span className="text-sm font-semibold truncate">{label}</span>
    </div>
  );
}

// Card section
function SectionCard({
  num,
  icon,
  title,
  hint,
  active,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm ring-1 overflow-hidden transition ${
        active ? 'ring-sky-200' : 'ring-gray-100'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${active ? 'bg-sky-500' : 'bg-gray-200'}`} />
      <div className="p-5 md:p-6 pl-6 md:pl-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                active ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {num}
            </span>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className={active ? 'text-sky-600' : 'text-gray-500'}>{icon}</span>
              {title}
            </h2>
          </div>
          {hint && <span className="text-xs font-semibold text-gray-500">{hint}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
