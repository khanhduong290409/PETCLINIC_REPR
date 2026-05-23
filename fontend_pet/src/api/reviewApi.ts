import { API_BASE_URL, getAuthHeaders } from './apiClient';

export interface ReviewResponse {
    id: number;
    customerName: string;
    bookingCode: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ReviewRequest {
    userId: number;
    bookingCode: string;
    rating: number;
    comment: string;
}

export const reviewApi = {
    // Public — hiển thị testimonials trên trang chủ
    async getAllReviews(): Promise<ReviewResponse[]> {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        return response.json();
    },

    async createReview(data: ReviewRequest): Promise<ReviewResponse> {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create review');
        return response.json();
    },

    async getReviewedBookingCodes(userId: number): Promise<string[]> {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${userId}/booking-codes`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch reviewed codes');
        return response.json();
    },
};
