import api from "@/lib/api";

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

class CategoryService {
  /**
   * Fetch main categories from /categories/main
   */
  async getMainCategories() {
    try {
      const response = await api.get("/categories/main");
      return response.data;
    } catch (error) {
      console.error("Error fetching main categories:", error);
      throw error;
    }
  }

  /**
   * Fetch categories by parent ID from /categories/by-parent/{parentId}
   */
  async getCategoriesByParent(parentId: number) {
    try {
      const response = await api.get(`/categories/by-parent/${parentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching categories by parent:", error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();

