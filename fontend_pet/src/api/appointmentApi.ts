import { API_BASE_URL, getAuthHeaders, readErrorMessage } from './apiClient';

export interface ServiceResponse {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  duration: number;
  category: string;
}

// userId không gửi lên — backend lấy từ JWT
export interface AppointmentRequest {
  petIds: number[];
  serviceIds: number[];
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

export interface ServiceInfo {
  id: number;
  title: string;
  price: number;
}

export interface AppointmentResponse {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  petImageUrl: string;
  services: ServiceInfo[];
  doctorName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes: string;
  createdAt: string;
}

// Tình trạng chỗ trống của một khung giờ
export interface SlotAvailability {
  time: string; // "09:00"
  bookedCount: number;
  capacity: number;
  customCapacity: number | null; // null = đang theo sức chứa mặc định
  remaining: number;
  disabled: boolean;
  past: boolean;
  available: boolean;
  note: string | null;
}

export const appointmentApi = {
  async getServices(): Promise<ServiceResponse[]> {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  },

  async createAppointments(data: AppointmentRequest): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Không thể đặt lịch. Vui lòng thử lại.'));
    }
    return response.json();
  },

  // date dạng "2026-10-10"
  async getAvailability(date: string): Promise<SlotAvailability[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/availability?date=${date}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  },

  async getAppointments(): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },

  async cancelAppointment(appointmentId: number): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  },
};
