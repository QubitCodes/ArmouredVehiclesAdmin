import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface VendorCategory {
  id: string;
  name: string;
  // Add other fields if API returns more
}

export interface VendorCategoryResponse {
  data?: VendorCategory[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching vendor categories from reference API
 */
export function useVendorCategories() {
  return useQuery<VendorCategory[], AxiosError>({
    queryKey: ["vendor-categories"],
    queryFn: async () => {
      const response = await api.get<VendorCategoryResponse | VendorCategory[]>(
        "/references/vendor-categories"
      );
      
      // Handle both response formats: { data: [...] } or direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (gcTime replaces cacheTime in React Query v5)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

