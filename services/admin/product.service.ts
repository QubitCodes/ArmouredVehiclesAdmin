import api from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  status?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string | null;
  stock?: number;
  sku?: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
}

class ProductService {
  /**
   * Fetch list of products from /admin/products
   */
  async getProducts(params: GetProductsParams = {}) {
    try {
      const response = await api.get("/admin/products", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string) {
    try {
      const response = await api.get(`/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }
}

export const productService = new ProductService();
