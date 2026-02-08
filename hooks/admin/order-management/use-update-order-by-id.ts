import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService, Order } from "@/services/admin/order.service";

export function useUpdateOrderById() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
            orderService.updateOrder(id, data),
        onSuccess: (data, variables) => {
            // Invalidate the specific order and the main group order if applicable
            // We don't know the main group ID here easily, but we can invalidate all "order" queries to be safe/simple
            // or just invalidate the specific ID.
            // Since the page views the group, invalidating "order" key is broad but works or we rely on the fact that
            // the page uses ["order", mainOrderId].
            // We will invalidate "order" generally or try to be specific if we passed mainId.
            // For now, invalidating all "order" queries ensures the list updates immediately.
            queryClient.invalidateQueries({ queryKey: ["order"] });
            toast.success("Order updated successfully");
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to update order";
            toast.error(message);
        },
    });
}
