import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface PaymentMethod {
  id: string;
  name: string;
  logo?: string;
  // Add other fields if API returns more
}

export interface PaymentMethodResponse {
  data?: PaymentMethod[];
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for fetching payment methods from reference API
 */
export function usePaymentMethods() {
  return useQuery<PaymentMethod[], AxiosError>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const response = await api.get<PaymentMethodResponse | PaymentMethod[]>(
        "/reference/payment-methods"
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

