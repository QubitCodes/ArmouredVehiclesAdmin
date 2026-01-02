import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
} from "@/services/admin/product.service";

/**
 * React Query hook for fetching a single product by ID
 */
export function useProduct(productId: string, enabled: boolean = true) {
  return useQuery<Product, AxiosError>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await productService.getProductById(productId);
      // Handle different response structures
      return response.data || response;
    },
    enabled: !!productId && enabled,
    retry: false, // Don't retry on error to prevent unnecessary requests
  });
}


