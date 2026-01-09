import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Order,
  orderService,
  GetOrdersParams,
} from "@/services/admin/order.service";

import { vendorService } from "@/services/admin/vendor.service";

/**
 * React Query hook for fetching orders
 */
export function useOrders(params: GetOrdersParams = {}) {
  return useQuery<Order[], AxiosError>({
    queryKey: ["orders", params],
    queryFn: async () => {
      // If vendorId is present, use the nested route
      if (params.vendorId) {
        // Need to cast or ensure types match. vendorService returns { success, data, ... }
        // getVendorOrders returns Promise<any> currently in my edit, let's fix types implicitly
        const response: any = await vendorService.getVendorOrders(params.vendorId, params);
        return response.data || [];
      }
      
      const response = await orderService.getOrders(params);
      return response.data || [];
    },
  });
}


