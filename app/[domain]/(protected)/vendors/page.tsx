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
  const onboardingStatus = searchParams.get("onboarding_status") || "approved_general";


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
    pending_count: 0
  };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    }
  }, [error]);

  // Smart Filter Default Logic
  // Check if there are any verification pending records.
  // If so, filter by pending. Else, show all.
  const hasFilter = searchParams.has("onboarding_status");
  const pendingCount = data?.pagination?.pending_count;

  useEffect(() => {
    // Only run if not loading, no user-selected filter exists, and we have pending count data
    if (!isLoading && !hasFilter && pendingCount !== undefined) {
      const params = new URLSearchParams(searchParams.toString());
      if (pendingCount > 0) {
        params.set("onboarding_status", "pending_verification");
      } else {
        params.set("onboarding_status", "all");
      }

      // Use replace to avoid adding to history stack
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isLoading, hasFilter, pendingCount, router, pathname, searchParams]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("onboarding_status", value);
    params.delete("page"); // Reset to page 1 when filter changes

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(url, { scroll: false });
  };

  const getEmptyMessage = () => {
    switch (onboardingStatus) {
      case "pending_verification":
        return "No pending verifications found.";
      case "approved_general":
        return "No approved (general) vendors found.";
      case "approved_controlled":
        return "No approved (controlled) vendors found.";
      case "rejected":
        return "No rejected vendors found.";
      case "in_progress":
        return "No vendors in progress found.";
      case "not_started":
        return "No not started vendors found.";
      default:
        return "No vendors found.";
    }
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
          <option value="approved_general">Approved (General)</option>
          <option value="approved_controlled">Approved (Controlled)</option>
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
          <VendorTable vendors={vendors} emptyMessage={getEmptyMessage()} />
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
