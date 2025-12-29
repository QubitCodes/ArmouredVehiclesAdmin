"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useOrders } from "@/hooks/admin/order-management/use-orders";
import { OrderTable } from "@/components/admin/order-management/order-table";

export default function OrdersPage() {
  // Use React Query to fetch orders
  const {
    data: orders = [],
    isLoading,
    error,
  } = useOrders();

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
  }, [error]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage orders.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading orders...
            </p>
          </div>
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}

