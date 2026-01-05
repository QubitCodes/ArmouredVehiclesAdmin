import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface EndUseMarket {
  id: string;
  name: string;
  // Add other fields if API returns more
}

export interface EndUseMarketResponse {
  data?: EndUseMarket[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching end-use market options from reference API
 */
export function useEndUseMarkets() {
  return useQuery<EndUseMarket[], AxiosError>({
    queryKey: ["end-use-markets"],
    queryFn: async () => {
      const response = await api.get<EndUseMarketResponse | EndUseMarket[]>(
        "/reference/end-use-markets"
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

