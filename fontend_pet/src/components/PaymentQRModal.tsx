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

const BANK_NAMES: Record<string, string> = {
  '970415': 'VietinBank',
};

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
    }, 1000); // dùng để từ 1s cho interval 15'

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
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

      <div className="flex flex-col md:flex-row">

        {/* LEFT — ORDER INFO */}
        <div className="md:w-64 bg-gradient-to-b from-gray-50 to-white p-6 border-r flex flex-col gap-5">

          <h2 className="text-lg font-semibold text-gray-800">
            Thông tin đơn hàng
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Mã đơn</p>
              <p className="text-sm font-medium text-gray-800 break-all">
                {orderNumber}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Mô tả</p>
              <p className="text-sm text-gray-700">
                Thanh toán đơn hàng
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Số tiền</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                {amount.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-auto">
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-orange-400">Hết hạn sau</p>
              <p className="text-sm font-mono font-semibold text-orange-600">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — QR */}
        <div className="flex-1 p-6 flex flex-col items-center">

          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Quét QR để thanh toán
          </h2>

          <p className="text-xs text-gray-500 text-center mb-4 max-w-xs">
            Dùng app ngân hàng hỗ trợ VietQR để thanh toán nhanh
          </p>

          {/* QR BOX */}
          <div className="relative group mb-5">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition"></div>

            <div className="relative p-3 bg-white rounded-2xl shadow-lg">
              <img
                src={qrCode}
                alt="QR thanh toán"
                className="w-48 h-48 object-contain"
              />

              {/* Scan corners */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br"></div>
              </div>
            </div>
          </div>

          {/* Tên ngân hàng */}
          <p className="text-sm font-medium text-gray-600 mb-1">
            {BANK_NAMES[bankName] ?? bankName}
          </p>

          {/* ACCOUNT */}
          <div className="w-full space-y-3">

            <div>
              <p className="text-xs text-gray-400 mb-1">Số tài khoản</p>
              <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-3 py-2 hover:border-gray-300 transition">
                <span className="text-sm font-medium text-gray-800">
                  {accountNumber}
                </span>

                <button
                  onClick={() => copyToClipboard(accountNumber, 'account')}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border hover:bg-gray-100 transition"
                >
                  {copiedAccount ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <Check size={14} /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={14} /> Copy
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* TRANSFER CONTENT */}
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Nội dung chuyển khoản
              </p>
              <div className="flex items-center justify-between bg-gray-50 border rounded-xl px-3 py-2 hover:border-gray-300 transition">
                <span className="text-sm font-medium text-gray-800 break-all">
                  {transferContent}
                </span>

                <button
                  onClick={() => copyToClipboard(transferContent, 'content')}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border hover:bg-gray-100 transition"
                >
                  {copiedContent ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <Check size={14} /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={14} /> Copy
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* ACTION */}
          <button
            onClick={onClose}
            className="mt-6 text-sm text-gray-400 hover:text-red-500 transition"
          >
            ✕ Hủy giao dịch
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
