import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface ProofType {
  id: string;
  name: string;
  // Add other fields if API returns more
}

export interface ProofTypeResponse {
  data?: ProofType[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching proof types from reference API
 */
export function useProofTypes() {
  return useQuery<ProofType[], AxiosError>({
    queryKey: ["proof-types"],
    queryFn: async () => {
      const response = await api.get<ProofTypeResponse | ProofType[]>(
        "/references/proof-types"
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

