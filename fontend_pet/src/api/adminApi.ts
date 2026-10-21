import { getAuthHeaders, readErrorMessage } from './apiClient';
import type { SlotAvailability } from './appointmentApi';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/admin`;
const SERVICES_API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/services`;

const CLOUDINARY_CLOUD_NAME = 'dm1xwivqn';
const CLOUDINARY_UPLOAD_PRESET = 'v5nd8djy';

export interface ServiceInfo {
  id: number;
  title: string;
  price: number;
}

export interface PetServiceData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  duration: number;
  category: string;
}

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

export interface AdminAppointment {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  services: ServiceInfo[];
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  doctorId: number | null;
  doctorName: string | null;
  ownerName: string;
  notes: string;
}

export interface DoctorInfo {
  id: number;
  fullName: string;
  email: string;
}

export interface CustomerSearchResult {
  id: number;
  fullName: string;
  phone: string | null;
  email: string;
  pets: { id: number; name: string; species: string }[];
}

// customerId = null → khách mới, dùng newCustomerName + newCustomerPhone
export interface WalkInAppointmentPayload {
  customerId: number | null;
  newCustomerName: string;
  newCustomerPhone: string;
  petIds: number[];
  newPetName: string;
  newPetSpecies: string;
  serviceIds: number[];
  appointmentDate: string;
  appointmentTime: string;
  doctorId: number;
  notes: string;
}

export interface DailyRevenue { date: string; revenue: number; }
export interface StatusCount { status: string; count: number; }
export interface ProductSale { productName: string; totalQuantity: number; }
export interface RecentOrder {
  orderNumber: string;
  userName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}
export interface UpcomingAppointment {
  bookingCode: string;
  petName: string;
  ownerName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}
export interface DashboardData {
  totalOrders: number;
  todayOrders: number;
  totalAppointments: number;
  todayAppointments: number;
  totalCustomers: number;
  revenueThisMonth: number;//card doanh thu thang nay
  revenueByDay: DailyRevenue[];//linechart doanh thu 30 ngay
  orderStatusCounts: StatusCount[];//piechart trạng thái đơn hàng
  appointmentStatusCounts: StatusCount[];//barchart lịch khám theo trạng thái
  topProducts: ProductSale[];//barchart nằm ngang top 5 sản phẩm
  recentOrders: RecentOrder[];//bảng 5 đơn hàng mới nhất
  upcomingAppointments: UpcomingAppointment[];//bảng 5 lịch khám sắp tới
}

export interface AdminOrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: number;
  orderNumber: string;
  userName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  notes: string;
  createdAt: string;
  items: AdminOrderItem[];
}

export const adminApi = {
  async getAppointments(): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async assignDoctor(appointmentId: number, doctorId: number): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/assign-doctor?doctorId=${doctorId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    // Bác sĩ trùng giờ bị backend từ chối → hiện đúng lý do
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể phân công bác sĩ. Thử lại.'));
    return res.json();
  },

  // === Khách đặt tại quầy ===

  async searchCustomers(keyword: string): Promise<CustomerSearchResult[]> {
    const res = await fetch(`${API}/customers/search?q=${encodeURIComponent(keyword)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to search customers');
    return res.json();
  },

  async createWalkInAppointments(payload: WalkInAppointmentPayload): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/walk-in-appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể tạo lịch. Thử lại.'));
    return res.json();
  },

  async unassignDoctor(appointmentId: number): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/unassign-doctor`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to unassign doctor');
    return res.json();
  },

  async updateStatus(appointmentId: number, status: string): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/status?status=${status}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    // Khôi phục lịch đã hủy có thể bị từ chối vì slot đầy → hiện đúng lý do
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể cập nhật trạng thái. Thử lại.'));
    return res.json();
  },

  // === Quản lý khung giờ ===

  async getSlotSettings(): Promise<{ defaultSlotCapacity: number }> {
    const res = await fetch(`${API}/slot-settings`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch slot settings');
    return res.json();
  },

  // Số khung giờ sắp tới sẽ bị vượt nếu đổi mặc định sang capacity
  async countSlotsOverCapacity(capacity: number): Promise<number> {
    const res = await fetch(`${API}/slot-settings/over-capacity?capacity=${capacity}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to count over-capacity slots');
    const data: { count: number } = await res.json();
    return data.count;
  },

  async updateDefaultCapacity(capacity: number): Promise<{ defaultSlotCapacity: number }> {
    const res = await fetch(`${API}/slot-settings?capacity=${capacity}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể lưu sức chứa mặc định'));
    return res.json();
  },

  async getTimeSlots(date: string): Promise<SlotAvailability[]> {
    const res = await fetch(`${API}/time-slots?date=${date}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch time slots');
    return res.json();
  },

  async getAppointmentsInSlot(date: string, time: string): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/time-slots/appointments?date=${date}&time=${time}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch appointments in slot');
    return res.json();
  },

  // capacity = null → quay về sức chứa mặc định
  async updateTimeSlot(payload: {
    date: string;
    time: string;
    capacity: number | null;
    disabled: boolean;
    note: string;
  }): Promise<SlotAvailability[]> {
    const res = await fetch(`${API}/time-slots`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể lưu khung giờ'));
    return res.json();
  },

  async setDayDisabled(date: string, disabled: boolean, note: string): Promise<SlotAvailability[]> {
    const res = await fetch(`${API}/time-slots/day`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ date, disabled, note }),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Không thể cập nhật ngày'));
    return res.json();
  },

  async getDoctors(): Promise<DoctorInfo[]> {
    const res = await fetch(`${API}/doctors`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },

  async getServices(): Promise<PetServiceData[]> {
    const res = await fetch(SERVICES_API, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async createService(payload: Omit<PetServiceData, 'id'>): Promise<PetServiceData> {
    const res = await fetch(SERVICES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  async updateService(id: number, payload: Omit<PetServiceData, 'id'>): Promise<PetServiceData> {
    const res = await fetch(`${SERVICES_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async deleteService(id: number): Promise<void> {
    const res = await fetch(`${SERVICES_API}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete service');
  },

  async getAllUsers(): Promise<UserInfo[]> {
    const res = await fetch(`${API}/users`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(userId: number, role: string): Promise<UserInfo> {
    const res = await fetch(`${API}/users/${userId}/role?role=${role}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  async updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<UserInfo> {
    const res = await fetch(`${API}/users/${userId}/status?status=${status}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(`${API}/dashboard`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },

  async getRevenue(period: 'day' | 'month' | 'quarter' | 'year'): Promise<DailyRevenue[]> {
    const res = await fetch(`${API}/revenue?period=${period}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch revenue');
    return res.json();
  },

  async getAllOrders(): Promise<AdminOrder[]> {
    const res = await fetch(`${API}/orders`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateOrderStatus(orderId: number, status: string): Promise<AdminOrder> {
    const res = await fetch(`${API}/orders/${orderId}/status?status=${status}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  async uploadServiceImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'PetsClinic/Services');
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.secure_url;
  },
};
