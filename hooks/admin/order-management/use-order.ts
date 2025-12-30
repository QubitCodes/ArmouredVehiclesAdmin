import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Order,
  orderService,
} from "@/services/admin/order.service";

/**
 * React Query hook for fetching a single order by ID
 */
export function useOrder(orderId: string, enabled: boolean = true) {
  return useQuery<Order, AxiosError>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await orderService.getOrderById(orderId);
      return response;
    },
    enabled: !!orderId && enabled,
    retry: false, // Don't retry on error to prevent unnecessary requests
  });
}

