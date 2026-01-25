import api from "@/lib/api";

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

class BrandService {
  /**
   * Get all brands
   */
  async getAll(params?: { search?: string }) {
    try {
      const response = await api.get<{ success: boolean; data: Brand[] }>('/brands', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Create a new brand
   */
  async create(data: { name: string; icon?: string }) {
    try {
      const response = await api.post<{ success: boolean; data: Brand }>('/brands', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }

  /**
   * Update a brand
   */
  async update(id: number, data: { name?: string; icon?: string }) {
    try {
      const response = await api.put<{ success: boolean; data: Brand }>(`/brands/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  }

  /**
   * Delete a brand
   */
  async delete(id: number) {
    try {
      await api.delete(`/brands/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  }
}

export const brandService = new BrandService();
