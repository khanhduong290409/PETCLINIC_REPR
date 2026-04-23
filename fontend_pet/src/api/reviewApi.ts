const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

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
    async getAllReviews(): Promise<ReviewResponse[]> {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        return response.json();
    },

    async createReview(data: ReviewRequest): Promise<ReviewResponse> {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create review');
        return response.json();
    },

    async getReviewedBookingCodes(userId: number): Promise<string[]> {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${userId}/booking-codes`);
        if (!response.ok) throw new Error('Failed to fetch reviewed codes');
        return response.json();
    },
};
