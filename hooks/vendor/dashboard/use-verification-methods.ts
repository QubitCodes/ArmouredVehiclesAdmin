import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface VerificationMethod {
  id: number;
  name: string;
  description: string;
  is_available: boolean;
  display_order: number;
  is_active: boolean;
}

export interface VerificationMethodResponse {
  data?: VerificationMethod[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching verification methods from reference API
 */
export function useVerificationMethods() {
  return useQuery<VerificationMethod[], AxiosError>({
    queryKey: ["verification-methods"],
    queryFn: async () => {
      const response = await api.get<VerificationMethodResponse | VerificationMethod[]>(
        "/references/verification-methods"
      );
      
      // Handle both response formats: { data: [...] } or direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

