import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Clock } from 'lucide-react';
import { paymentApi } from '../api/paymentApi';

interface Props {
  orderId: number;
  orderCode: number;
  qrCode: string;       // URL ảnh QR từ PayOS
  checkoutUrl: string;  // Link mở trang PayOS nếu muốn
  amount: number;
  onClose: () => void;
}

// Polling mỗi 4 giây, tối đa 15 phút
const POLL_INTERVAL_MS = 4000;
const MAX_WAIT_MS = 15 * 60 * 1000;

export default function PaymentQRModal({ orderId, orderCode, qrCode, checkoutUrl, amount, onClose }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'waiting' | 'paid' | 'error'>('waiting');
  const [timeLeft, setTimeLeft] = useState(MAX_WAIT_MS / 1000); // giây
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Đếm ngược thời gian chờ
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling kiểm tra trạng thái thanh toán
    pollRef.current = setInterval(async () => {
      try {
        const result = await paymentApi.checkStatus(orderCode);
        if (result.status === 'PAID') {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          setStatus('paid');
          // Chuyển trang sau 2 giây để user thấy thông báo thành công
          setTimeout(() => {
            navigate(`/orders/${orderId}`, { state: { justPaid: true } });
          }, 2000);
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời, tiếp tục polling
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollRef.current!);
      clearInterval(countdownRef.current!);
    };
  }, [orderCode, orderId, navigate]);

  // Format giây thành mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">

        {/* Nút đóng */}
        {status === 'waiting' && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        )}

        {/* Thanh toán thành công */}
        {status === 'paid' && (
          <div className="flex flex-col items-center p-10 gap-4">
            <CheckCircle size={64} className="text-green-500" />
            <p className="text-xl font-bold text-gray-800">Thanh toán thành công!</p>
            <p className="text-gray-500 text-sm">Đang chuyển đến đơn hàng...</p>
          </div>
        )}

        {/* Đang chờ thanh toán */}
        {status === 'waiting' && (
          <div className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Quét mã QR để thanh toán</h2>

            {/* QR Code */}
            <img
              src={qrCode}
              alt="QR thanh toán"
              className="w-56 h-56 border rounded-xl object-contain"
            />

            {/* Số tiền */}
            <div className="text-center">
              <p className="text-sm text-gray-500">Số tiền</p>
              <p className="text-2xl font-bold text-rose-600">
                {amount.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Thời gian còn lại */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock size={16} />
              <span>Hết hạn sau: <span className="font-mono font-semibold text-gray-700">{formatTime(timeLeft)}</span></span>
            </div>

            {/* Hướng dẫn */}
            <p className="text-xs text-gray-400 text-center">
              Mở app ngân hàng, chọn quét QR và quét mã trên.<br />
              Trang tự động cập nhật sau khi thanh toán.
            </p>

            {/* Link mở PayOS nếu muốn thanh toán trên web */}
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 text-sm hover:underline"
            >
              Hoặc thanh toán qua trang PayOS
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
