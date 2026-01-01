"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useOrders } from "@/hooks/admin/order-management/use-orders";
import { OrderTable } from "@/components/admin/order-management/order-table";

export default function VendorOrdersPage() {
  const params = useParams();
  const vendorId = params.userId as string;

  // Fetch orders for this vendor
  const {
    data: orders = [],
    isLoading,
    error,
  } = useOrders({ vendorId });

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendor orders:", error);
      toast.error("Failed to fetch vendor orders");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading vendor orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {orders.length === 0 ? (
        <div className="border p-8 text-center text-muted-foreground">
          No orders found for this vendor.
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}

