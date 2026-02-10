import api from "@/lib/api";

export interface ReferenceItem {
  id: number;
  name: string;
  is_active: boolean;
  display_order: number;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
}

class ReferenceService {
  /**
   * Get all available reference types (tables)
   */
  async getReferenceTypes() {
    try {
      // We might not have a dedicated endpoint for listing types yet, 
      // but we can hardcode them or add one.
      // ReferenceController had getReferenceTypes.
      // But route for it? /api/v1/references/types ?
      // Currently /api/v1/references just falls into [type] param.
      // I need to add a route for /types in the backend or just hardcode known types.
      // For now, I'll rely on hardcoded types in the UI component to avoid route collision with [type].
      // Actually, standardizing on known types is safer.
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch data for a specific reference type
   */
  async getData(type: string) {
    try {
      const response = await api.get<{ success: boolean; data: ReferenceItem[] }>(`/references/${type}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching reference ${type}:`, error);
      throw error;
    }
  }

  /**
   * Create a new reference item
   */
  async createItem(type: string, data: { name: string; isActive?: boolean }) {
    try {
      const response = await api.post(`/references/${type}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error creating reference item in ${type}:`, error);
      throw error;
    }
  }

  /**
   * Update a reference item
   */
  async updateItem(type: string, id: number, data: { name?: string; isActive?: boolean; displayOrder?: number }) {
    try {
      const response = await api.put(`/references/${type}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating reference item in ${type}:`, error);
      throw error;
    }
  }

  /**
   * Delete a reference item
   */
  async deleteItem(type: string, id: number) {
    try {
      await api.delete(`/references/${type}/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting reference item in ${type}:`, error);
      throw error;
    }
  }
}

export const referenceService = new ReferenceService();
