"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { useProducts } from "@/hooks/admin/product-management/use-products";
import { ProductTable } from "@/components/admin/product-management/product-table";
import { ProductActions } from "@/components/admin/product-management/product-actions";
import { AddProductDialog } from "@/components/admin/product-management/add-product-dialog";

export default function ProductsPage() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

  // Use React Query to fetch products
  const {
    data: products = [],
    isLoading,
    error,
  } = useProducts();

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  }, [error]);

  const handleAddProduct = () => {
    setIsAddProductDialogOpen(true);
  };

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

      <ProductActions onAddProduct={handleAddProduct} />

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

      <AddProductDialog
        open={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
      />
    </div>
  );
}




