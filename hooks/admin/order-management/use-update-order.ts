import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService, Order } from "@/services/admin/order.service";

export function useUpdateOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Order>) => orderService.updateOrder(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Order updated successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to update order";
      toast.error(message);
    },
  });
}
