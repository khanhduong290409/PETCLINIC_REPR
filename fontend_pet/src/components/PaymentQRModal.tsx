import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { paymentApi } from '../api/paymentApi';

interface Props {
  orderId: number;
  orderCode: number;
  qrCode: string;
  orderNumber: string;
  transferContent: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  onClose: () => void;
}

// Polling mỗi 4 giây, tối đa 15 phút
const POLL_INTERVAL_MS = 4000;
const MAX_WAIT_MS = 15 * 60 * 1000;

export default function PaymentQRModal({
  orderId, orderCode, qrCode,
  orderNumber, transferContent, accountNumber, bankName,
  amount, onClose,
}: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'waiting' | 'paid'>('waiting');
  const [timeLeft, setTimeLeft] = useState(MAX_WAIT_MS / 1000);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const result = await paymentApi.checkStatus(orderCode);
        if (result.status === 'PAID') {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          setStatus('paid');
          setTimeout(() => navigate(`/orders/${orderId}`, { state: { justPaid: true } }), 2000);
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollRef.current!);
      clearInterval(countdownRef.current!);
    };
  }, [orderCode, orderId, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copyToClipboard = (text: string, type: 'account' | 'content') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  // Thanh toán thành công
  if (status === 'paid') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center p-10 gap-4">
          <CheckCircle size={64} className="text-green-500" />
          <p className="text-xl font-bold text-gray-800">Thanh toán thành công!</p>
          <p className="text-gray-500 text-sm">Đang chuyển đến đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Layout 2 cột */}
        <div className="flex flex-col md:flex-row">

          {/* Cột trái — Thông tin đơn hàng */}
          <div className="bg-gray-50 p-6 md:w-56 shrink-0 flex flex-col gap-4 border-b md:border-b-0 md:border-r">
            <h2 className="text-base font-bold text-gray-800">Thông tin đơn hàng</h2>

            <div>
              <p className="text-xs text-gray-500 mb-1">Mã đơn hàng</p>
              <p className="text-sm font-medium text-gray-800 break-all">{orderNumber}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Mô tả</p>
              <p className="text-sm text-gray-700">Thanh toán đơn hàng</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Số tiền</p>
              <p className="text-xl font-bold text-blue-600">
                {amount.toLocaleString('vi-VN')} VND
              </p>
            </div>

            <div className="mt-auto">
              <p className="text-xs text-gray-400">Hết hạn sau</p>
              <p className="text-sm font-mono font-semibold text-orange-500">{formatTime(timeLeft)}</p>
            </div>
          </div>

          {/* Cột phải — QR + thông tin ngân hàng */}
          <div className="flex-1 p-6 flex flex-col items-center gap-4">
            <h2 className="text-base font-bold text-gray-800">Quét QR để thanh toán</h2>
            <p className="text-xs text-gray-500 text-center">
              Sử dụng ứng dụng ngân hàng hỗ trợ VietQR để quét mã và thanh toán nhanh chóng.
            </p>

            {/* QR image */}
            <img
              src={qrCode}
              alt="QR thanh toán"
              className="w-44 h-44 border rounded-xl object-contain"
            />

            {/* Tên ngân hàng */}
            <p className="text-sm font-medium text-gray-700">{bankName}</p>

            {/* Số tài khoản */}
            <div className="w-full">
              <p className="text-xs text-gray-500 mb-1">Số tài khoản</p>
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-800">{accountNumber}</span>
                <button
                  onClick={() => copyToClipboard(accountNumber, 'account')}
                  className="text-gray-400 hover:text-gray-700 ml-2 shrink-0"
                  title="Sao chép"
                >
                  {copiedAccount ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Nội dung chuyển khoản */}
            <div className="w-full">
              <p className="text-xs text-gray-500 mb-1">Nội dung chuyển khoản</p>
              <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-800 break-all">{transferContent}</span>
                <button
                  onClick={() => copyToClipboard(transferContent, 'content')}
                  className="text-gray-400 hover:text-gray-700 ml-2 shrink-0"
                  title="Sao chép"
                >
                  {copiedContent ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Hủy */}
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 mt-1"
            >
              ✕ Hủy giao dịch
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
