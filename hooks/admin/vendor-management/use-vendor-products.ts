import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
  GetProductsParams,
} from "@/services/admin/product.service";

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

/**
 * React Query hook for fetching vendor products
 */
export function useVendorProducts(userId: string, params: GetProductsParams = {}) {
  return useQuery<ProductsResponse, AxiosError>({
    queryKey: ["vendor-products", userId, params],
    queryFn: async () => {
      const response = await productService.getVendorProducts(userId, params);
      const misc = response.misc || { total: 0, page: 1, limit: 10, pages: 1 };
      return {
        products: response.data || [],
        pagination: {
          page: misc.page,
          totalPages: misc.pages,
          total: misc.total,
          limit: misc.limit,
        },
      };
    },
    enabled: !!userId,
  });
}

