import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Vendor,
  vendorService,
  GetVendorsParams,
} from "@/services/admin/vendor.service";

/**
 * React Query hook for fetching vendors
 */
export function useVendors(params: GetVendorsParams = {}) {
  return useQuery<Vendor[], AxiosError>({
    queryKey: ["vendors", params],
    queryFn: async () => {
      const response = await vendorService.getVendors(params);
      // Response structure: { vendors: [...], total, page, limit }
      return response.vendors || [];
    },
  });
}

