import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Vendor,
  vendorService,
  GetVendorsParams,
} from "@/services/admin/vendor.service";

interface VendorsResponse {
  vendors: Vendor[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

/**
 * React Query hook for fetching vendors
 */
export function useVendors(params: GetVendorsParams = {}) {
  return useQuery<VendorsResponse, AxiosError>({
    queryKey: ["vendors", params],
    queryFn: async () => {
      const limit = params.limit || 10;
      const response = await vendorService.getVendors(params);
      const vendors = response.data || [];
      const misc = response.misc;
      return {
        vendors,
        pagination: {
          page: misc?.page ?? params.page ?? 1,
          totalPages: misc?.pages ?? Math.ceil((misc?.total ?? vendors.length) / limit),
          total: misc?.total ?? vendors.length,
          limit,
        },
      };
    },
  });
}

