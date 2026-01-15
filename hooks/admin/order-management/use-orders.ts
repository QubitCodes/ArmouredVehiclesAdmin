import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Order,
  orderService,
  GetOrdersParams,
} from "@/services/admin/order.service";

import { vendorService } from "@/services/admin/vendor.service";

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

/**
 * React Query hook for fetching orders
 */
export function useOrders(params: GetOrdersParams = {}) {
  return useQuery<OrdersResponse, AxiosError>({
    queryKey: ["orders", params],
    queryFn: async () => {
      const limit = params.limit || 10;

      // If vendorId is present, use the nested route
      if (params.vendorId) {
        const response: any = await vendorService.getVendorOrders(params.vendorId, params);
        const data = response.data || [];
        const misc = response.misc || {};
        return {
          orders: data,
          pagination: {
            page: misc.page ?? params.page ?? 1,
            totalPages: misc.pages ?? Math.ceil((misc.total ?? data.length) / limit),
            total: misc.total ?? data.length,
            limit,
          },
        };
      }

      const response = await orderService.getOrders(params);
      const orders = response.data || [];
      const misc = response.misc || {};
      return {
        orders,
        pagination: {
          page: misc.page ?? params.page ?? 1,
          totalPages: misc.pages ?? Math.ceil((misc.total ?? orders.length) / limit),
          total: misc.total ?? orders.length,
          limit,
        },
      };
    },
  });
}


