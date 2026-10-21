import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

// Thay cho window.confirm / window.alert / window.prompt của trình duyệt.
// Style theo modal "Xác nhận xóa" ở AdminServices.

type ModalVariant = 'danger' | 'warning' | 'info';

const VARIANT_STYLES: Record<ModalVariant, { iconBox: string; button: string }> = {
  danger: {
    iconBox: 'bg-rose-100 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
  warning: {
    iconBox: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    iconBox: 'bg-sky-100 text-sky-600',
    button: 'bg-sky-600 hover:bg-sky-700',
  },
};

function VariantIcon({ variant }: { variant: ModalVariant }) {
  if (variant === 'info') return <Info size={24} />;
  if (variant === 'warning') return <AlertTriangle size={24} />;
  return <XCircle size={24} />;
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  variant?: ModalVariant;
  confirmLabel?: string;
  // null = ẩn nút hủy (dùng như alert, chỉ có 1 nút)
  cancelLabel?: string | null;
  // Đang xử lý: khóa nút, không cho đóng
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Nội dung thêm dưới message, ví dụ ô nhập lý do (thay cho prompt)
  children?: ReactNode;
}

export default function ConfirmModal({
  open,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  // Nhấn Esc để đóng, giống hộp thoại của trình duyệt
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const styles = VARIANT_STYLES[variant];

  const handleBackdropClick = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${styles.iconBox}`}>
            <VariantIcon variant={variant} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">{title}</h2>
          <div className="text-gray-600 text-sm text-center whitespace-pre-line">{message}</div>

          {children && <div className="mt-4">{children}</div>}

          <div className="flex gap-3 mt-6">
            {cancelLabel !== null && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-60"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-semibold transition shadow-sm disabled:opacity-60 ${styles.button}`}
            >
              {loading ? 'Đang xử lý...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
