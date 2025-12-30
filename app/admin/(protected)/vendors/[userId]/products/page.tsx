"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useVendorProducts } from "@/hooks/admin/vendor-management/use-vendor-products";
import { ProductTable } from "@/components/admin/product-management/product-table";

export default function VendorProductsPage() {
  const params = useParams();
  const userId = params.userId as string;

  // Fetch vendor products from /vendor/products API
  const {
    data: vendorProducts = [],
    isLoading: isLoadingProducts,
    error,
  } = useVendorProducts(userId);

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching vendor products:", error);
      toast.error("Failed to fetch vendor products");
    }
  }, [error]);

  if (isLoadingProducts) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading vendor products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {vendorProducts.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No products found for this vendor.
        </div>
      ) : (
        <ProductTable products={vendorProducts} />
      )}
    </div>
  );
}

