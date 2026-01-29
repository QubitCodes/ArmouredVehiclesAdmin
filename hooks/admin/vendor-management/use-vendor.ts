import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Vendor,
  vendorService,
} from "@/services/admin/vendor.service";

/**
 * React Query hook for fetching a single vendor by userId
 */
export function useVendor(userId: string, enabled: boolean = true) {
  return useQuery<Vendor, AxiosError>({
    queryKey: ["vendor", userId],
    queryFn: async () => {
      const response = await vendorService.getVendorByUserId(userId);
      return response;
    },
    enabled: !!userId && enabled,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

