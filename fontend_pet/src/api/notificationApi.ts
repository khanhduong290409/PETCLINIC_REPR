import { API_BASE_URL, getAuthHeaders } from './apiClient';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  bookingCode: string | null;
  read: boolean;
  createdAt: string;
}

export const STREAM_UNAUTHORIZED = 'STREAM_UNAUTHORIZED';

export const notificationApi = {
  async getNotifications(): Promise<NotificationItem[]> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch unread count');
    const body: { count: number } = await response.json();
    return body.count;
  },

  async markRead(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  },

  async markAllRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
  },

  // Mở kết nối SSE và gọi onNotification mỗi khi có thông báo mới.
  // Dùng fetch thay cho EventSource vì EventSource không gửi được header Authorization
  // (phải nhét token lên URL → lộ token trong log server).
  // Promise kết thúc khi server đóng kết nối; ném lỗi khi mất mạng / bị abort.
  async openStream(onNotification: (item: NotificationItem) => void, signal: AbortSignal): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/stream`, {
      headers: { Accept: 'text/event-stream', ...getAuthHeaders() },
      signal,
    });
    // Token hết hạn / không hợp lệ → báo riêng để bên gọi không thử kết nối lại vô ích
    if (response.status === 401 || response.status === 403) {
      throw new Error(STREAM_UNAUTHORIZED);
    }
    if (!response.ok || response.body === null) {
      throw new Error('Failed to open notification stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      buffer += decoder.decode(value, { stream: true });

      // Các event SSE cách nhau bởi 1 dòng trống; phần cuối có thể chưa nhận đủ → giữ lại trong buffer
      const rawEvents = buffer.split('\n\n');
      buffer = rawEvents.pop() ?? '';

      for (const rawEvent of rawEvents) {
        const parsed = parseSseEvent(rawEvent);
        if (parsed.eventName === 'notification' && parsed.data !== '') {
          onNotification(JSON.parse(parsed.data));
        }
      }
    }
  },
};

// Một event SSE dạng:
//   event:notification
//   data:{"id":1,...}
// Dòng bắt đầu bằng ":" là comment (heartbeat ": ping") → bỏ qua
function parseSseEvent(rawEvent: string): { eventName: string; data: string } {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.substring('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.substring('data:'.length).trimStart());
    }
  }
  return { eventName, data: dataLines.join('\n') };
}
