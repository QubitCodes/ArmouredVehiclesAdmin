import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { categoryService, Category } from "@/services/admin/category.service";

/**
 * React Query hook for fetching main categories
 */
export function useMainCategories() {
  return useQuery<Category[], AxiosError>({
    queryKey: ["mainCategories"],
    queryFn: async () => {
      const response = await categoryService.getMainCategories();
      // Handle different response structures
      return Array.isArray(response) ? response : response.data || response.categories || [];
    },
  });
}

/**
 * React Query hook for fetching categories by parent ID
 */
export function useCategoriesByParent(parentId: number | undefined) {
  return useQuery<Category[], AxiosError>({
    queryKey: ["categoriesByParent", parentId],
    queryFn: async () => {
      if (!parentId) {
        return [];
      }
      const response = await categoryService.getCategoriesByParent(parentId);
      // Handle different response structures
      return Array.isArray(response) ? response : response.data || response.categories || [];
    },
    enabled: !!parentId, // Only fetch when parentId is provided
  });
}

