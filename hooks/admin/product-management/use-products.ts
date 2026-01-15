import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Product,
  productService,
  GetProductsParams,
  CreateProductRequest,
  UpdateProductRequest,
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
 * React Query hook for fetching products
 */
export function useProducts(params: GetProductsParams = {}) {
  return useQuery<ProductsResponse, AxiosError>({
    queryKey: ["products", params],
    queryFn: async () => {
      const response = await productService.getProducts(params);
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

/**
 * React Query hook for updating an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    AxiosError,
    { id: string; data: UpdateProductRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await productService.updateProduct(id, data);
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate and refetch products list after successful update
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/**
 * React Query hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: async (id: string) => {
      await productService.deleteProduct(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches for this product to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["product", id] });
      // Remove the specific product query from cache immediately
      queryClient.removeQueries({ queryKey: ["product", id] });
    },
    onSuccess: (_, id) => {
      // Invalidate and immediately refetch all products queries
      queryClient.invalidateQueries({
        queryKey: ["products"],
        refetchType: "all",
      });
      // Ensure the product query is removed
      queryClient.removeQueries({ queryKey: ["product", id] });
    },
  });
}
