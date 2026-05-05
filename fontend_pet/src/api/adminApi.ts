const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/admin`;
const SERVICES_API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/services`;

const CLOUDINARY_CLOUD_NAME = 'dm1xwivqn';
const CLOUDINARY_UPLOAD_PRESET = 'v5nd8djy';
// import.meta.env.VITE_API_URL → đọc biến môi trường tên VITE_API_URL
//Khi nào thêm VITE_API_URL?
//Sau khi deploy backend lên Railway xong, Railway sẽ cho bạn 1 URL dạng:
//https://petclinic-backend.up.railway.app
//Lúc đó vào Vercel → Settings → Environment Variables → thêm:
//VITE_API_URL = https://petclinic-backend.up.railway.app
//→ Redeploy → frontend gọi đúng backend trên cloud.
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

  // ---- Quản lý dịch vụ ----

  async getServices(): Promise<PetServiceData[]> {
    const res = await fetch(SERVICES_API);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async createService(payload: Omit<PetServiceData, 'id'>): Promise<PetServiceData> {
    const res = await fetch(SERVICES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  async updateService(id: number, payload: Omit<PetServiceData, 'id'>): Promise<PetServiceData> {
    const res = await fetch(`${SERVICES_API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async deleteService(id: number): Promise<void> {
    const res = await fetch(`${SERVICES_API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete service');
  },

  // ---- Quản lý user ----

  async getAllUsers(): Promise<UserInfo[]> {
    const res = await fetch(`${API}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(userId: number, role: string): Promise<UserInfo> {
    const res = await fetch(`${API}/users/${userId}/role?role=${role}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  async updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<UserInfo> {
    const res = await fetch(`${API}/users/${userId}/status?status=${status}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Upload ảnh dịch vụ lên Cloudinary
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
