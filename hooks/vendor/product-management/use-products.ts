import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  vendorProductService,
  GetProductsParams,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/services/vendor/product.service";

/**
 * React Query hook for fetching vendor products
 */
export function useVendorProducts(params: GetProductsParams = {}) {
  return useQuery<Product[], AxiosError>({
    queryKey: ["vendor-products", params],
    queryFn: async () => {
      const response = await vendorProductService.getProducts(params);
      // Response structure: { products: [...], total, page, limit }
      return response.products || [];
    },
  });
}

/**
 * React Query hook for creating a new product
 */
export function useCreateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, AxiosError, CreateProductRequest>({
    mutationFn: async (data: CreateProductRequest) => {
      const response = await vendorProductService.createProduct(data);
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate and refetch products list after successful creation
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
  });
}

/**
 * React Query hook for updating an existing product
 */
export function useUpdateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    AxiosError,
    { id: string; data: UpdateProductRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await vendorProductService.updateProduct(id, data);
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate and refetch products list after successful update
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
  });
}

/**
 * React Query hook for deleting a product
 */
export function useDeleteVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: async (id: string) => {
      await vendorProductService.deleteProduct(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches for this product to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["vendor-product", id] });
      // Remove the specific product query from cache immediately
      queryClient.removeQueries({ queryKey: ["vendor-product", id] });
    },
    onSuccess: (_, id) => {
      // Invalidate and refetch products list after successful deletion
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      // Ensure the product query is removed (redundant but safe)
      queryClient.removeQueries({ queryKey: ["vendor-product", id] });
    },
  });
}

