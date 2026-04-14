import { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
    exiting: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    // Xóa toast khỏi array
    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Bật cờ exiting → trigger animation thoát
    const startExiting = (id: number) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    };

    // Dùng cho nút đóng: animate rồi xóa
    const dismissToast = (id: number) => {
        startExiting(id);
        setTimeout(() => removeToast(id), 300);
    };

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId.current++;
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);

        // Sau 2700ms: bắt đầu animation thoát (300ms)
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        }, 2700);
        // Sau 3000ms: xóa khỏi DOM
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);
    // GIẢI THÍCH LÍ DO VÌ SAO TOAST ĐẦU TIÊN LUÔN BỊ LAG -> CHẬM
    /*
lần đầu gọi showtoast -> showtoast gọi settoast đây là state thuộc sở hữu của provider nên
sau khi settoast thực thi xong nó sẽ đánh dấu cần provider re-render(sau khi chạy xong code trong hàm showtoast) thì re-render
sau khi re-render provider tạo lại showtoast mới -> value của provider bị thay đổi (<ToastContext.Provider value={{ showToast }}>)
khi value của provider bị thay đổi, react sẽ re-render các consumer(là những nơi dùng showtoast của provider)
React propagate xuống toàn cây → CartContext, Navbar... tất cả re-render
React flush toàn bộ re-render cascade (ĐỒNG BỘ)
Browser bị CHẶN vẽ frame cho đến khi toàn bộ cascade xong <- đây là lí do mất khá lâu để hiện ra toast đầu tiên
Đây là điểm mấu chốt. React không paint ra màn hình cho đến khi toàn bộ cascade này xong:
những lần sau ( toast thứ 2) nhanh hơn là bởi vì JS engine đã chạy code đó 1 lần rồi nên đã có sẵn
việc dùng usecallback giúp giữ nguyên reference của function này quan các lần re-render
(Mỗi lần re-render → showToast VẪN LÀ function cũ (cùng địa chỉ memory))
*/


    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast stack - mỗi toast độc lập */}
            <div className="fixed top-20 right-5 z-9999 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            relative flex items-center gap-3
                            pl-4 pr-3 py-3
                            rounded-lg shadow-lg border
                            text-sm font-medium
                            min-w-64 max-w-xs
                            ${toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
                            ${toast.type === 'success' ? 'bg-sky-50 border-sky-200 text-sky-900' : ''}
                            ${toast.type === 'error'   ? 'bg-red-50 border-red-200 text-red-900' : ''}
                            ${toast.type === 'info'    ? 'bg-amber-50 border-amber-200 text-amber-900' : ''}
                        `}
                    >
                        {/* Dải màu bên trái */}
                        <div className={`
                            absolute left-0 top-0 h-full w-1 rounded-l-lg
                            ${toast.type === 'success' ? 'bg-sky-500' : ''}
                            ${toast.type === 'error'   ? 'bg-red-500' : ''}
                            ${toast.type === 'info'    ? 'bg-amber-400' : ''}
                        `} />

                        {/* Icon */}
                        <div className={`
                            shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                            ${toast.type === 'success' ? 'bg-sky-100 text-sky-600' : ''}
                            ${toast.type === 'error'   ? 'bg-red-100 text-red-600' : ''}
                            ${toast.type === 'info'    ? 'bg-amber-100 text-amber-600' : ''}
                        `}>
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error'   && '✕'}
                            {toast.type === 'info'    && 'i'}
                        </div>

                        <span className="flex-1 leading-snug">{toast.message}</span>

                        {/* Nút đóng */}
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className={`
                                shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs
                                opacity-50 hover:opacity-100 transition-opacity
                                ${toast.type === 'success' ? 'hover:bg-sky-200' : ''}
                                ${toast.type === 'error'   ? 'hover:bg-red-200' : ''}
                                ${toast.type === 'info'    ? 'hover:bg-amber-200' : ''}
                            `}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast phải được dùng trong ToastProvider');
    }
    return context;
}
