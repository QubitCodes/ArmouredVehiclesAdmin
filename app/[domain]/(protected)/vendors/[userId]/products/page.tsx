"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useVendorProducts } from "@/hooks/admin/vendor-management/use-vendor-products";
import { ProductTable } from "@/components/admin/product-management/product-table";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { authService } from "@/services/admin/auth.service";

function VendorProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const domain = (params?.domain as string) || "admin";
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const rawStatus = searchParams.get("approval_status") || "all";
  const approvalStatus = rawStatus || "all";

  // Permission Check
  useEffect(() => {
    const hasProductPerm = authService.hasAnyPermission([
      'product.view',
      'product.manage',
      'product.approve',
      'product.controlled.approve'
    ], true);

    if (!hasProductPerm) {
      toast.error("You do not have permission to view products.");
      router.push(`/${domain}/vendors/${userId}`);
    }
  }, [domain, router, userId]);

  const handleStatusFilterChange = (newStatus: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("approval_status", newStatus);
    nextParams.set("page", "1"); // Reset to page 1 on filter change
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  // Fetch vendor products with search and pagination parameters
  const {
    data,
    isLoading: isLoadingProducts,
    error,
  } = useVendorProducts(userId, {
    search: search || undefined,
    page,
    limit: 10,
    approval_status: (approvalStatus === "all" || !approvalStatus)
      ? undefined
      : approvalStatus,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendor products:", error);
      toast.error("Failed to fetch vendor products");
    }
  }, [error]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-end items-center gap-4">
        <Select
          value={approvalStatus}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="w-[200px] h-11 bg-bg-light border border-border"
        >
          <option value="all">All Approval Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <SearchInput placeholder="Search by name" />
      </div>

      {isLoadingProducts ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading vendor products...
            </p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="border p-8 text-center text-muted-foreground bg-bg-light rounded-lg">
          No products found for this vendor.
        </div>
      ) : (
        <>
          <ProductTable products={products} fromVendor={true} />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}
    </div>
  );
}

export default function VendorProductsPage() {
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
      <VendorProductsContent />
    </Suspense>
  );
}
