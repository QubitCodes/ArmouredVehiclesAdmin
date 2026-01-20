import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Customer,
  customerService,
  GetCustomersParams,
} from "@/services/admin/customer.service";

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

/**
 * React Query hook for fetching customers
 */
export function useCustomers(params: GetCustomersParams = {}) {
  return useQuery<CustomersResponse, AxiosError>({
    queryKey: ["customers", params],
    queryFn: async () => {
      const limit = params.limit || 10;
      const response = await customerService.getCustomers(params);
      const customers = response.data || [];
      const misc = response.misc;
      return {
        customers,
        pagination: {
          page: misc?.page ?? params.page ?? 1,
          totalPages: misc?.pages ?? Math.ceil((misc?.total ?? customers.length) / limit),
          total: misc?.total ?? customers.length,
          limit,
        },
      };
    },
  });
}
