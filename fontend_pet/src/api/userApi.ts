import { API_BASE_URL, getAuthHeaders } from './apiClient';

export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
}

export interface UpdateProfileResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
}

export const userApi = {
  async updateProfile(userId: number, data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },
};
