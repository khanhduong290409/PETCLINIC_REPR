import { getAuthHeaders } from './apiClient';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/doctor`;

export interface ServiceInfo {
  id: number;
  title: string;
  price: number;
}

export interface DoctorAppointment {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  petImageUrl: string;
  services: ServiceInfo[];
  ownerName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes: string;
}

// Không gửi doctorId — backend lấy bác sĩ đang đăng nhập từ JWT
export const doctorApi = {
  async getMyAppointments(): Promise<DoctorAppointment[]> {
    const res = await fetch(`${API}/appointments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async completeAppointment(appointmentId: number): Promise<DoctorAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete appointment');
    return res.json();
  },
};
