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
      // Response structure: { orders: [...], total, page, limit }
      return response.orders || [];
    },
  });
}


