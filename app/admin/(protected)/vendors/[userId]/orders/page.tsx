"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { useOrders } from "@/hooks/admin/order-management/use-orders";
import { OrderTable } from "@/components/admin/order-management/order-table";

function VendorOrdersContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vendorId = params.userId as string;
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  // Fetch orders for this vendor with search and pagination parameters
  const { data, isLoading, error } = useOrders({
    vendorId,
    search: search || undefined,
    page,
    limit: 10,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendor orders:", error);
      toast.error("Failed to fetch vendor orders");
    }
  }, [error]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-end">
        <SearchInput placeholder="Search by order ID or customer" />
      </div>

      {isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading vendor orders...
            </p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="border p-8 text-center text-muted-foreground bg-bg-light rounded-lg">
          No orders found for this vendor.
        </div>
      ) : (
        <>
          <OrderTable
            orders={orders}
            basePath="/admin/orders"
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}
    </div>
  );
}

export default function VendorOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <VendorOrdersContent />
    </Suspense>
  );
}

