import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
  GetProductsParams,
} from "@/services/admin/product.service";

/**
 * React Query hook for fetching products
 */
export function useProducts(params: GetProductsParams = {}) {
  return useQuery<Product[], AxiosError>({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await productService.getProducts(params);
      console.log("Raw API response:", response);
      // Handle different response structures
      const products = Array.isArray(response) ? response : response.data || response.products || [];
      console.log("Parsed products:", products);
      return products;
    },
  });
}
