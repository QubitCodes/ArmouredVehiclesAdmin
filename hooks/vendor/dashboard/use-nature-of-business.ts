import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface NatureOfBusiness {
  id: string;
  name: string;
  // Add other fields if API returns more
}

export interface NatureOfBusinessResponse {
  data?: NatureOfBusiness[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching nature of business options from reference API
 */
export function useNatureOfBusiness() {
  return useQuery<NatureOfBusiness[], AxiosError>({
    queryKey: ["nature-of-business"],
    queryFn: async () => {
      const response = await api.get<NatureOfBusinessResponse | NatureOfBusiness[]>(
        "/references/nature-of-business"
      );
      
      // Handle both response formats: { data: [...] } or direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (gcTime replaces cacheTime in React Query v5)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

