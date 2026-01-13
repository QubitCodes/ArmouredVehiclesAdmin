import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface FinancialInstitution {
  id: string;
  name: string;
  // Add other fields if API returns more
}

export interface FinancialInstitutionResponse {
  data?: FinancialInstitution[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching financial institutions from reference API
 */
export function useFinancialInstitutions() {
  return useQuery<FinancialInstitution[], AxiosError>({
    queryKey: ["financial-institutions"],
    queryFn: async () => {
      const response = await api.get<FinancialInstitutionResponse | FinancialInstitution[]>(
        "/references/financial-institutions"
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

