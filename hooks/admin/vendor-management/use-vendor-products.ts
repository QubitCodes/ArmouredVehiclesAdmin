import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
  GetProductsParams,
} from "@/services/admin/product.service";

/**
 * React Query hook for fetching vendor products
 */
export function useVendorProducts(userId: string, params: GetProductsParams = {}) {
  return useQuery<Product[], AxiosError>({
    queryKey: ["vendor-products", userId, params],
    queryFn: async () => {
      const response = await productService.getVendorProducts(userId, params);
      // Response structure: { status: true, data: [...], misc: {...} }
      return response.data || [];
    },
    enabled: !!userId,
  });
}

