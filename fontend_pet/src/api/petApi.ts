// Pet API calls

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;
const CLOUDINARY_CLOUD_NAME = 'dm1xwivqn';
const CLOUDINARY_UPLOAD_PRESET = 'v5nd8djy';

export interface PetResponse {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
}

export interface PetRequest {
  userId: number;
  name: string;
  species: string;
  breed: string;
  age: number | null;
  weight: number | null;
  gender: string;
  notes: string;
  imageUrl: string;
}

export const petApi = {
  // Lấy danh sách pet của user
  async getPets(userId: number): Promise<PetResponse[]> {
    const response = await fetch(`${API_BASE_URL}/pets?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch pets');
    return response.json();
  },

  // Thêm pet mới
  async createPet(data: PetRequest): Promise<PetResponse> {
    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create pet');
    return response.json();
  },

  // Sửa pet
  async updatePet(petId: number, data: PetRequest): Promise<PetResponse> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update pet');
    return response.json();
  },

  // Xóa pet
  async deletePet(petId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}?userId=${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete pet');
  },

  // Upload ảnh pet lên Cloudinary
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // cloudinary có 2 cách upload: signed: cần secret key ở backend để ký request ( bảo mật hơn) 
    // và cách 2 là dùng upload_preset, ko cần secret key, fontend gọi thẳng được
    formData.append('folder', 'PetsClinic'); // dòng này để nói với cloudinary: lưu ảnh vào folder tên PetsClinic trong account
    //nếu ko có dòng này thì ảnh vẫn được lưu nhưng nằm ở thư mục gốc, lộn xộn.

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.secure_url;
  },
};
