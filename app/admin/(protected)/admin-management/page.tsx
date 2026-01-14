"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { useAdmins } from "@/hooks/admin/admin-management/use-admins";
import { AdminTable } from "@/components/admin/admin-management/admin-table";
import { AdminActions } from "@/components/admin/admin-management/admin-actions";
import { AddAdminDialog } from "@/components/admin/admin-management/add-admin-dialog";

function AdminManagementContent() {
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  // Use React Query to fetch admins with search and pagination parameters
  const {
    data,
    isLoading,
    error,
  } = useAdmins({ search: search || undefined, page, limit: 10 });

  const admins = data?.admins || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 10 };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins");
    }
  }, [error]);

  const handleAddAdmin = () => {
    setIsAddAdminDialogOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Admin Management
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage admin users.
        </p>
      </div>

      <AdminActions onAddAdmin={handleAddAdmin} />

      {isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading admins...
            </p>
          </div>
        </div>
      ) : (
        <>
          <AdminTable admins={admins} />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}

      <AddAdminDialog
        open={isAddAdminDialogOpen}
        onOpenChange={setIsAddAdminDialogOpen}
      />
    </div>
  );
}

export default function AdminManagementPage() {
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
      <AdminManagementContent />
    </Suspense>
  );
}
