import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { notificationApi, STREAM_UNAUTHORIZED } from '../api/notificationApi';
import type { NotificationItem } from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Chờ bao lâu rồi mới kết nối lại khi stream bị đứt (server restart, mất mạng...)
const RECONNECT_DELAY_MS = 5000;
// Backend chỉ trả 30 thông báo mới nhất — giữ đúng số đó ở frontend
const MAX_NOTIFICATIONS = 30;

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (item: NotificationItem) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chỉ khách và bác sĩ có thông báo lịch khám
  const canReceive = user !== null && (user.role === 'USER' || user.role === 'DOCTOR');
  const userId = user ? user.id : null;

  useEffect(() => {
    if (!canReceive) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // abort() khi logout / đổi tài khoản / unmount → đóng stream và dừng kết nối lại
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const loadFromServer = async () => {
      try {
        const [list, count] = await Promise.all([
          notificationApi.getNotifications(),
          notificationApi.getUnreadCount(),
        ]);
        if (controller.signal.aborted) {
          return;
        }
        setNotifications(list);
        setUnreadCount(count);
      } catch {
        // Lỗi mạng: lần kết nối lại sau sẽ tải lại
      }
    };

    const handleNewNotification = (item: NotificationItem) => {
      setNotifications(prev => {
        // Có thể đã nằm trong danh sách vừa tải lại từ server
        const alreadyExists = prev.some(existing => existing.id === item.id);
        if (alreadyExists) {
          return prev;
        }
        return [item, ...prev].slice(0, MAX_NOTIFICATIONS);
      });
      setUnreadCount(prev => prev + 1);
      showToast(item.title, 'info');
    };

    const connect = async () => {
      // Mở stream trước rồi mới tải danh sách: thông báo phát sinh trong lúc mất kết nối
      // sẽ có trong danh sách, thông báo mới từ giờ trở đi đi qua stream
      const streamDone = notificationApi.openStream(handleNewNotification, controller.signal);
      loadFromServer();

      try {
        await streamDone;
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        // Token hết hạn → kết nối lại cũng bị từ chối, chờ người dùng đăng nhập lại
        if (error instanceof Error && error.message === STREAM_UNAUTHORIZED) {
          return;
        }
      }

      if (!controller.signal.aborted) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      controller.abort();
      clearTimeout(reconnectTimer);
    };
  }, [canReceive, userId, showToast]);

  const markRead = async (item: NotificationItem) => {
    if (item.read) {
      return;
    }
    // Cập nhật giao diện trước cho mượt, gọi API sau
    setNotifications(prev => prev.map(existing => {
      if (existing.id === item.id) {
        return { ...existing, read: true };
      }
      return existing;
    }));
    setUnreadCount(prev => Math.max(prev - 1, 0));
    try {
      await notificationApi.markRead(item.id);
    } catch {
      // Lưu thất bại: lần tải lại sau sẽ hiện lại đúng trạng thái từ server
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(existing => ({ ...existing, read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      showToast('Không thể đánh dấu đã đọc. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications phải được dùng trong NotificationProvider');
  }
  return context;
}
