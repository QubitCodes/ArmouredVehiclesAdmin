"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useVendors } from "@/hooks/admin/vendor-management/use-vendors";
import { VendorTable } from "@/components/admin/vendor-management/vendor-table";

function VendorsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const onboardingStatus = searchParams.get("onboarding_status") || "pending_verification";

  // Use React Query to fetch vendors with search, pagination, and onboarding_status parameters
  const { data, isLoading, error } = useVendors({
    search: search || undefined,
    page,
    limit: 10,
    onboarding_status: onboardingStatus !== "all" ? onboardingStatus : undefined,
  });

  const vendors = data?.vendors || [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  }, [error]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("onboarding_status", value);
    params.delete("page"); // Reset to page 1 when filter changes

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url, { scroll: false });
  };

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

      <div className="flex items-center justify-end gap-3">
        <Select value={onboardingStatus} onChange={handleStatusChange} className="w-50 h-11 bg-bg-light border border-border-light">
          <option value="all">All</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <SearchInput placeholder="Search by name or email..." />
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
        <>
          <VendorTable vendors={vendors} />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}
    </div>
  );
}

export default function VendorManagementPage() {
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
      <VendorsContent />
    </Suspense>
  );
}
