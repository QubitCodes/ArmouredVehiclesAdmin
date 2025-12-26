import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Order,
  orderService,
  GetOrdersParams,
} from "@/services/admin/order.service";

/**
 * React Query hook for fetching orders
 */
export function useOrders(params: GetOrdersParams = {}) {
  return useQuery<Order[], AxiosError>({
    queryKey: ["orders", params],
    queryFn: async () => {
      const response = await orderService.getOrders(params);
      console.log("Raw API response:", response);
      // Handle different response structures
      const orders = Array.isArray(response) ? response : response.data || response.orders || [];
      console.log("Parsed orders:", orders);
      return orders;
    },
  });
}

