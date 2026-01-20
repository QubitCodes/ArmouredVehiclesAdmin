"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/hooks/admin/customer-management/use-customers";
import { CustomerTable } from "@/components/admin/customer-management/customer-table";
import { Users } from "lucide-react";

function CustomersContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const status = searchParams.get("status") || "all";

    // Use React Query to fetch customers
    const { data, isLoading, error } = useCustomers({
        search: search || undefined,
        page,
        limit: 10,
        status: status !== "all" ? status : undefined,
    });

    const customers = data?.customers || [];
    const pagination = data?.pagination || {
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10,
    };

    // Show error toast when query fails
    useEffect(() => {
        if (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to fetch customers");
        }
    }, [error]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", value);
        params.delete("page"); // Reset to page 1 when filter changes

        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;
        router.push(url, { scroll: false });
    };

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Customers
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your customer base and view their account details.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
                <Select value={status} onChange={handleStatusChange} className="w-40 h-11 bg-bg-light border border-border-light">
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </Select>
                <SearchInput placeholder="Search by name, email or phone..." />
            </div>

            {isLoading ? (
                <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Spinner size="3xl" className="text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">
                            Loading customers...
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <CustomerTable customers={customers} />
                    {customers.length > 0 && <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                    />}
                </>
            )}
        </div>
    );
}

export default function CustomerManagementPage() {
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
            <CustomersContent />
        </Suspense>
    );
}
