import { API_BASE_URL, getAuthHeaders } from './apiClient';

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
  async getById(petId: number, userId: number): Promise<PetResponse> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch pet');
    return response.json();
  },

  async getPets(userId: number): Promise<PetResponse[]> {
    const response = await fetch(`${API_BASE_URL}/pets?userId=${userId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch pets');
    return response.json();
  },

  async createPet(data: PetRequest): Promise<PetResponse> {
    const response = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create pet');
    return response.json();
  },

  async updatePet(petId: number, data: PetRequest): Promise<PetResponse> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update pet');
    return response.json();
  },

  async deletePet(petId: number, userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pets/${petId}?userId=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete pet');
  },

  // Upload lên Cloudinary trực tiếp — không cần auth header
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'PetsClinic');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.secure_url;
  },
};
