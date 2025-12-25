"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useAdmins } from "@/hooks/admin/admin-management/use-admins";
import { AdminTable } from "@/components/admin/admin-management/admin-table";
import { AdminActions } from "@/components/admin/admin-management/admin-actions";

export default function AdminManagementPage() {
  // Use React Query to fetch admins
  const {
    data: admins = [],
    isLoading,
    error,
  } = useAdmins();

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins");
    }
  }, [error]);

  const handleAddAdmin = () => {
    // TODO: Implement add admin dialog/modal
    toast.info("Add Admin feature - Open dialog/modal here");
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
        <AdminTable admins={admins} />
      )}
    </div>
  );
}
