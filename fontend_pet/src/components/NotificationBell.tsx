import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationItem } from '../api/notificationApi';

// "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", quá 7 ngày thì hiện ngày
function formatTimeAgo(createdAt: string): string {
  const createdTime = new Date(createdAt).getTime();
  const diffMinutes = Math.floor((Date.now() - createdTime) / 60000);

  if (diffMinutes < 1) {
    return 'vừa xong';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) {
    return `${diffDays} ngày trước`;
  }
  return new Date(createdAt).toLocaleDateString('vi-VN');
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài (cùng cách với menu tài khoản trên Navbar)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (item: NotificationItem) => {
    markRead(item);
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  let badgeText = String(unreadCount);
  if (unreadCount > 9) {
    badgeText = '9+';
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Thông báo</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-sky-700 hover:underline">
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Chưa có thông báo nào</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {notifications.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${item.read ? '' : 'bg-sky-50/60'}`}
                  >
                    {/* Chấm xanh = chưa đọc; giữ chỗ trống khi đã đọc để chữ thẳng hàng */}
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-transparent' : 'bg-sky-500'}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm text-gray-800 ${item.read ? '' : 'font-semibold'}`}>{item.title}</span>
                      <span className="block text-xs text-gray-600 mt-0.5">{item.message}</span>
                      <span className="block text-[11px] text-gray-400 mt-1">{formatTimeAgo(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
