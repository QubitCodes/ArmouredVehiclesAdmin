"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useVendorProducts } from "@/hooks/vendor/product-management/use-products";
import { VendorProductTable } from "@/components/vendor/product-management/product-table";
import { VendorProductActions } from "@/components/vendor/product-management/product-actions";

export default function VendorProductsPage() {
  // Use React Query to fetch vendor products
  const {
    data: products = [],
    isLoading,
    error,
  } = useVendorProducts();

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
          Manage your products.
        </p>
      </div>

      <VendorProductActions />

      {isLoading ? (
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="3xl" className="text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading products...
            </p>
          </div>
        </div>
      ) : (
        <VendorProductTable products={products} />
      )}
    </div>
  );
}

