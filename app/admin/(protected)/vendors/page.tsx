"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useVendors } from "@/hooks/admin/vendor-management/use-vendors";
import { VendorTable } from "@/components/admin/vendor-management/vendor-table";

export default function VendorManagementPage() {
  // Use React Query to fetch vendors
  const {
    data: vendors = [],
    isLoading,
    error,
  } = useVendors();

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  }, [error]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Vendors
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage vendors.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading vendors...
            </p>
          </div>
        </div>
      ) : (
        <VendorTable vendors={vendors} />
      )}
    </div>
  );
}

