import api from "@/lib/api";

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  parent_id?: number | null; // For API compatibility
}

class CategoryService {
  /**
   * Fetch main categories from /categories/main
   */
  async getMainCategories() {
    try {
      const response = await api.get("/categories/main");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching main categories:", error);
      throw error;
    }
  }

  /**
   * Fetch all categories
   */
  async getAllCategories() {
    try {
      const response = await api.get("/categories");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching all categories:", error);
      throw error;
    }
  }

  /**
   * Fetch categories by parent ID from /categories/by-parent/{parentId}
   */
  async getCategoriesByParent(parentId: number) {
    try {
      const response = await api.get(`/categories/by-parent/${parentId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching categories by parent:", error);
      throw error;
    }
  }
  /**
   * Fetch category by ID
   */
  async getCategoryById(id: number | string) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  async createCategory(data: Partial<Category> & { parentId?: number | null }) {
    try {
      const response = await api.post("/categories", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: number | string, data: Partial<Category> & { parentId?: number | null }) {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number | string) {
    try {
      await api.delete(`/categories/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();

