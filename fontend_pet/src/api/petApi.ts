// Pet API calls

const API_BASE_URL = 'http://localhost:8080/api';
const BACKEND_URL = 'http://localhost:8080';

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

  // Upload ảnh pet
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData, // Không set Content-Type, browser tự thêm boundary
    });
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    // Trả về full URL: http://localhost:8080/uploads/xxx.jpg
    return `${BACKEND_URL}${data.url}`;
  },
};
