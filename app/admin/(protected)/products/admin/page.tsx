"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useProducts } from "@/hooks/admin/product-management/use-products";
import { ProductTable } from "@/components/admin/product-management/product-table";
import { ProductActions } from "@/components/admin/product-management/product-actions";

export default function AdminProductsPage() {
  // Use React Query to fetch products
  const {
    data: products = [],
    isLoading,
    error,
  } = useProducts();

  // Debug logging
  useEffect(() => {
    console.log("Products data:", products);
    console.log("Loading state:", isLoading);
    console.log("Error state:", error);
  }, [products, isLoading, error]);

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching products:", error);
      const axiosError = error as any;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.message || "Failed to fetch products";
      toast.error(errorMessage);
    }
  }, [error]);


  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Admin Products
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage admin products.
        </p>
      </div>

      <ProductActions />

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
        <ProductTable products={products} />
      )}
    </div>
  );
}

