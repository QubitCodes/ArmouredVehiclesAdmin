"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/services/admin/auth.service";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { useProducts } from "@/hooks/admin/product-management/use-products";
import { ProductTable } from "@/components/admin/product-management/product-table";
import { useRouter, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProductActions } from "@/components/admin/product-management/product-actions";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [showVendorToggle, setShowVendorToggle] = useState(false);

  useEffect(() => {
    const user = authService.getUserDetails();
    if (user && ["admin", "super_admin"].includes(user.userType)) {
      setShowVendorToggle(true);
    }
  }, []);

  const scope = (searchParams.get("scope") as "admin" | "vendor" | "all") || undefined;

  // Use React Query to fetch products with search and pagination parameters
  const {
    data,
    isLoading,
    error,
  } = useProducts({ search: search || undefined, page, limit: 10, scope });

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 10 };

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  }, [error]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Products
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage products.
        </p>


      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ProductActions />
        {showVendorToggle && (
          <div className="flex items-center space-x-2">
            <Switch
              id="vendor-products"
              checked={searchParams.get('scope') === 'all'}
              onCheckedChange={(checked) => {
                const params = new URLSearchParams(searchParams.toString());
                if (checked) {
                  params.set('scope', 'all');
                } else {
                  params.delete('scope');
                }
                router.replace(`${pathname}?${params.toString()}`);
              }}
            />
            <Label htmlFor="vendor-products">View All Vendor Products</Label>
          </div>
        )}
      </div>

      {
        isLoading ? (
          <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="3xl" className="text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading products...
              </p>
            </div>
          </div>
        ) : (
          <>
            <ProductTable products={products} />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
            />
          </>
        )
      }
    </div >
  );
}

export default function ProductsPage() {
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
      <ProductsContent />
    </Suspense>
  );
}




