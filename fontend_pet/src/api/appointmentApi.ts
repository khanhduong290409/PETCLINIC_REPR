// Appointment & Service API calls

const API_BASE_URL = 'http://localhost:8080/api';

export interface ServiceResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: number; // phút
  category: string;
}

export interface AppointmentRequest {
  userId: number;
  petIds: number[];
  serviceId: number;
  appointmentDate: string; // "2026-02-20"
  appointmentTime: string; // "09:00"
  notes: string;
}

export interface AppointmentResponse {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  petImageUrl: string;
  serviceTitle: string;
  servicePrice: number;
  doctorName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes: string;
  createdAt: string;
}

export const appointmentApi = {
  // Lấy danh sách dịch vụ
  async getServices(): Promise<ServiceResponse[]> {
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  },

  // Đặt lịch khám
  async createAppointments(data: AppointmentRequest): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create appointments');
    return response.json();
  },

  // Lấy danh sách lịch khám của user
  async getAppointments(userId: number): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },

  // Hủy lịch khám
  async cancelAppointment(appointmentId: number, userId: number): Promise<AppointmentResponse[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel?userId=${userId}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  },
};
