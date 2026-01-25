"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { useAdmins, useDeleteAdmin } from "@/hooks/admin/admin-management/use-admins";
import { AdminTable } from "@/components/admin/admin-management/admin-table";
import { AdminActions } from "@/components/admin/admin-management/admin-actions";
import { AdminDialog } from "@/components/admin/admin-management/admin-dialog";
import { Admin } from "@/services/admin/admin.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

function AdminManagementContent() {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const controlled = searchParams.get("controlled") || undefined;

  // Use React Query to fetch admins with search and pagination parameters
  const {
    data,
    isLoading,
    error,
  } = useAdmins({ search: search || undefined, page, limit: 10, controlled });

  const deleteAdminMutation = useDeleteAdmin();

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
    setSelectedAdmin(null);
    setIsAdminDialogOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsAdminDialogOpen(true);
  };

  const handleDeleteClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;

    try {
      await deleteAdminMutation.mutateAsync(selectedAdmin.id);
      toast.success("Admin deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
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
          <AdminTable
            admins={admins}
            onEditAdmin={handleEditAdmin}
            onDeleteAdmin={handleDeleteClick}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </>
      )}

      <AdminDialog
        open={isAdminDialogOpen}
        onOpenChange={setIsAdminDialogOpen}
        admin={selectedAdmin}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the admin
              account for <span className="font-semibold text-foreground">{selectedAdmin?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAdminMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteAdminMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAdminMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
