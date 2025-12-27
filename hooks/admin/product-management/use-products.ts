import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
  GetProductsParams,
  CreateProductRequest,
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

/**
 * React Query hook for creating a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, AxiosError, CreateProductRequest>({
    mutationFn: async (data: CreateProductRequest) => {
      const response = await productService.createProduct(data);
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate and refetch products list after successful creation
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
