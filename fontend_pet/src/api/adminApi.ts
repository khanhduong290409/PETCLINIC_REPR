import { getAuthHeaders } from './apiClient';

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
  revenueThisMonth: number;
  revenueByDay: DailyRevenue[];
  orderStatusCounts: StatusCount[];
  appointmentStatusCounts: StatusCount[];
  topProducts: ProductSale[];
  recentOrders: RecentOrder[];
  upcomingAppointments: UpcomingAppointment[];
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
    if (!res.ok) throw new Error('Failed to assign doctor');
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
    if (!res.ok) throw new Error('Failed to update status');
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
