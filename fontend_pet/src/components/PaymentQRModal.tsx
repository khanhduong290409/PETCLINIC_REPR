import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Check, QrCode, X } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-500">
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] w-full max-w-sm flex flex-col items-center p-8 gap-4 animate-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            <CheckCircle size={64} className="text-green-500 relative z-10 animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-bold text-gray-800 tracking-tight">Thanh toán thành công!</p>
            <p className="text-sm text-gray-500 font-medium">Hệ thống đang chuyển hướng...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Style CSS nội tuyến cho hiệu ứng quét mã QR và thanh cuộn mượt */}
      <style>{`
        @keyframes qr-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-qr-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #3b82f6; /* Blue 500 */
          box-shadow: 0 0 12px 2px rgba(59, 130, 246, 0.6);
          animation: qr-scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          z-index: 20;
        }
        .scan-gradient {
          position: absolute;
          top: -30px;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2));
        }
        .modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
        {/* Thu nhỏ max-w-3xl thành max-w-2xl và giới hạn chiều cao max-h-[95vh] */}
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-2xl max-h-[95vh] overflow-y-auto modal-scroll font-sans relative">
          
          <div className="flex flex-col md:flex-row h-full">
            {/* LEFT — ORDER INFO */}
            {/* Thu nhỏ độ rộng md:w-80 thành md:w-64 */}
            <div className="md:w-64 bg-gray-50/50 p-5 md:p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col gap-5">
              
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <QrCode size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                    Thông tin đơn hàng
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Mã đơn hàng</p>
                    <p className="text-sm font-semibold text-gray-800 break-all">
                      {orderNumber}
                    </p>
                  </div>

                  <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Số tiền thanh toán</p>
                    <p className="text-xl font-extrabold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {amount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="mt-auto pt-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100/50 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                  <p className="text-xs font-medium text-orange-600">Thời gian còn lại</p>
                  <p className="text-base font-mono font-bold text-orange-600 tracking-wider">
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT — QR */}
            <div className="flex-1 p-5 md:p-6 flex flex-col items-center bg-white relative">
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-5 mt-1">
                <h2 className="text-lg font-bold text-gray-800 tracking-tight mb-1">
                  Quét QR để thanh toán
                </h2>
                <p className="text-xs text-gray-500 font-medium max-w-[200px] mx-auto">
                  Dùng App Ngân hàng hoặc Ví điện tử
                </p>
              </div>

              {/* QR BOX WITH SCAN EFFECT */}
              <div className="relative group mb-5">
                {/* Glow effect behind QR */}
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-2xl opacity-50 transition duration-500 group-hover:opacity-100"></div>

                <div className="relative p-3.5 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100">
                  <div className="relative overflow-hidden rounded-lg bg-white">
                    {/* Thu nhỏ mã QR để cân đối */}
                    <img
                      src={qrCode}
                      alt="QR thanh toán"
                      className="w-40 h-40 md:w-44 md:h-44 object-contain relative z-10 mix-blend-multiply"
                    />
                    
                    {/* Đường scan màu xanh */}
                    <div className="animate-qr-scan">
                      <div className="scan-gradient"></div>
                    </div>
                  </div>

                  {/* 4 góc viền quét (Scan corners) */}
                  <div className="absolute inset-0 pointer-events-none p-2">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-[3px] border-r-[3px] border-blue-500 rounded-br-lg"></div>
                  </div>
                </div>
              </div>

              {/* Tên ngân hàng */}
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-xs mb-5 border border-blue-100">
                {BANK_NAMES[bankName] ?? bankName}
              </div>

              {/* ACCOUNT & CONTENT COPY */}
              <div className="w-full max-w-sm space-y-3">
                {/* ACCOUNT */}
                <div className="group relative bg-gray-50 border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-all">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Số tài khoản</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-800 tracking-tight">
                      {accountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(accountNumber, 'account')}
                      className="flex items-center gap-1 text-[13px] px-2.5 py-1.5 rounded-md bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 font-medium transition-all shadow-sm group-hover:shadow"
                    >
                      {copiedAccount ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Check size={14} strokeWidth={3} /> Đã chép
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Copy size={14} /> Sao chép
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* TRANSFER CONTENT */}
                <div className="group relative bg-gray-50 border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-all">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Nội dung chuyển khoản
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 break-all pr-2">
                      {transferContent}
                    </span>
                    <button
                      onClick={() => copyToClipboard(transferContent, 'content')}
                      className="flex-shrink-0 flex items-center gap-1 text-[13px] px-2.5 py-1.5 rounded-md bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 font-medium transition-all shadow-sm group-hover:shadow"
                    >
                      {copiedContent ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Check size={14} strokeWidth={3} /> Đã chép
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Copy size={14} /> Sao chép
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}