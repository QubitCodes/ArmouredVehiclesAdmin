import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { vendorService } from "@/services/admin/vendor.service";
import { Order } from "@/services/admin/order.service";

/**
 * React Query hook for fetching a single order for a vendor
 */
export function useVendorOrder(vendorId: string, orderId: string) {
  return useQuery<Order, AxiosError>({
    queryKey: ["vendor-order", vendorId, orderId],
    queryFn: async () => {
      // Calls vendorService.getVendorOrder which calls /admin/vendors/{vendorId}/orders/{orderId}
      return vendorService.getVendorOrder(vendorId, orderId);
    },
    enabled: !!vendorId && !!orderId,
  });
}
