const API = 'http://localhost:8080/api/doctor';

export interface DoctorAppointment {
  id: number;
  bookingCode: string;
  petName: string;
  petSpecies: string;
  petImageUrl: string;
  serviceTitle: string;
  servicePrice: number;
  ownerName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  notes: string;
}

export const doctorApi = {
  // Lấy lịch khám được phân công cho bác sĩ
  async getMyAppointments(doctorId: number): Promise<DoctorAppointment[]> {
    const res = await fetch(`${API}/appointments?doctorId=${doctorId}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  // Xác nhận đã khám xong (complete cả nhóm bookingCode)
  async completeAppointment(appointmentId: number, doctorId: number): Promise<DoctorAppointment[]> {
    const res = await fetch(`${API}/appointments/${appointmentId}/complete?doctorId=${doctorId}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to complete appointment');
    return res.json();
  },
};
