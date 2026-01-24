"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/admin/auth.service";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { useOrders } from "@/hooks/admin/order-management/use-orders";
import { OrderTable } from "@/components/admin/order-management/order-table";

function OrdersContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  // State for Show All toggle
  const [showAll, setShowAll] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUserDetails();
    if (user && user.userType) {
        setUserRole(user.userType.toLowerCase());
    }
  }, []);

  // Use React Query to fetch orders with search and pagination parameters
  const { data, isLoading, error } = useOrders({
    search: search || undefined,
    page,
    limit: 10,
    vendorId: showAll ? undefined : 'admin'
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

      <div className="flex items-center justify-between">
         <div className="flex items-center space-x-2">
             {userRole !== 'vendor' && (
                 <>
                    <input 
                    type="checkbox" 
                    id="show-all" 
                    checked={showAll} 
                    onChange={(e) => setShowAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="show-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Show All Orders (All Vendors)
                    </label>
                 </>
             )}
         </div>
         <SearchInput placeholder="Search by order ID or customer" />
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
        <>
          <OrderTable orders={orders} />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
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
      <OrdersContent />
    </Suspense>
  );
}

