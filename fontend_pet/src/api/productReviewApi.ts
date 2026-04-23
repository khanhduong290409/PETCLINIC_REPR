const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

export interface ProductReviewResponse {
    id: number;
    productId: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ProductReviewRequest {
    userId: number;
    productId: number;
    rating: number;
    comment: string;
}

export const productReviewApi = {
    async getReviewsByProduct(productId: number): Promise<ProductReviewResponse[]> {
        const response = await fetch(`${API_BASE_URL}/product-reviews/product/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product reviews');
        return response.json();
    },

    async createReview(data: ProductReviewRequest): Promise<ProductReviewResponse> {
        const response = await fetch(`${API_BASE_URL}/product-reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create product review');
        return response.json();
    },

    async getReviewedProductIds(userId: number): Promise<number[]> {
        const response = await fetch(`${API_BASE_URL}/product-reviews/user/${userId}/product-ids`);
        if (!response.ok) throw new Error('Failed to fetch reviewed product ids');
        return response.json();
    },
};
