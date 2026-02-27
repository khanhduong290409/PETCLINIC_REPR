const API = 'http://localhost:8080/api/admin';

export interface AdminAppointment {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  serviceTitle: string;
  servicePrice: number;
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

export const adminApi = {
  // Lấy tất cả lịch khám
  async getAppointments(): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  // Phân công bác sĩ (trả về toàn bộ nhóm cùng bookingCode)
  async assignDoctor(appointmentId: number, doctorId: number): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/assign-doctor?doctorId=${doctorId}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to assign doctor');
    return res.json();
  },

  // Bỏ phân công bác sĩ (trả về toàn bộ nhóm cùng bookingCode)
  async unassignDoctor(appointmentId: number): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/unassign-doctor`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to unassign doctor');
    return res.json();
  },

  // Đổi trạng thái lịch khám (trả về toàn bộ nhóm cùng bookingCode)
  async updateStatus(appointmentId: number, status: string): Promise<AdminAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/status?status=${status}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Lấy danh sách bác sĩ
  async getDoctors(): Promise<DoctorInfo[]> {
    const res = await fetch(`${API}/doctors`);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },
};
