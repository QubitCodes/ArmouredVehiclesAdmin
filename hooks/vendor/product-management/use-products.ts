import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  vendorProductService,
  GetProductsParams,
  GetProductsResponse,
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
      // API returns array directly: [...]
      // If response is an array, return it; otherwise check for products property
      if (Array.isArray(response)) {
        return response;
      }
      // Fallback for wrapped response structure
      return (response as GetProductsResponse).products || [];
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
 * React Query hook for fetching a single product by ID
 */
export function useVendorProduct(id: string | null) {
  return useQuery<Product, AxiosError>({
    queryKey: ["vendor-product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      const response = await vendorProductService.getProductById(id);
      return response.data || response;
    },
    enabled: !!id, // Only fetch when id is provided
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

/**
 * React Query hook for uploading product assets
 */
export function useUploadProductAssets() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    AxiosError,
    { id: string; formData: FormData }
  >({
    mutationFn: async ({ id, formData }) => {
      const response = await vendorProductService.uploadProductAssets(
        id,
        formData
      );
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch product data after successful upload
      queryClient.invalidateQueries({ queryKey: ["vendor-product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
  });
}

