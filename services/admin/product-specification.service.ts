import api from '@/lib/api';

export interface ProductSpecification {
	id?: string;
	product_id?: number;
	label?: string | null;
	value?: string | null;
	type: 'general' | 'title_only' | 'value_only';
	active: boolean;
	sort: number;
	created_at?: string;
	updated_at?: string;
}

export interface CreateSpecificationRequest {
	label?: string | null;
	value?: string | null;
	type?: 'general' | 'title_only' | 'value_only';
	active?: boolean;
	sort?: number;
}

export interface UpdateSpecificationRequest {
	label?: string | null;
	value?: string | null;
	type?: 'general' | 'title_only' | 'value_only';
	active?: boolean;
	sort?: number;
}

/**
 * Service for product specification CRUD operations
 */
export const productSpecificationService = {
	/**
	 * Get all specifications for a product
	 */
	async getSpecifications(productId: string | null): Promise<ProductSpecification[]> {
		if (!productId) return [];
		const response = await api.get(`/products/${productId}/specifications`);
		return response.data?.data || [];
	},

	/**
	 * Create a new specification
	 */
	async createSpecification(productId: string, data: CreateSpecificationRequest): Promise<ProductSpecification> {
		const response = await api.post(`/products/${productId}/specifications`, data);
		return response.data?.data;
	},

	/**
	 * Update a single specification
	 */
	async updateSpecification(productId: string, specId: string, data: UpdateSpecificationRequest): Promise<ProductSpecification> {
		const response = await api.put(`/products/${productId}/specifications/${specId}`, data);
		return response.data?.data;
	},

	/**
	 * Bulk update/create specifications
	 */
	async bulkUpdateSpecifications(productId: string, specifications: ProductSpecification[]): Promise<ProductSpecification[]> {
		const response = await api.put(`/products/${productId}/specifications`, specifications);
		return response.data?.data || [];
	},

	/**
	 * Delete a specification
	 */
	async deleteSpecification(productId: string, specId: string): Promise<void> {
		await api.delete(`/products/${productId}/specifications/${specId}`);
	},
};
