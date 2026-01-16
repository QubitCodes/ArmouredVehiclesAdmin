"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Product } from "@/services/admin/product.service";
import { normalizeImageUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useDeleteProduct, useUpdateProductStatus } from "@/hooks/admin/product-management/use-products";
import { Select } from "@/components/ui/select";

interface ProductTableProps {
  products: Product[];
  fromVendor?: boolean;
}

export function ProductTable({
  products,
  fromVendor = false,
}: ProductTableProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const deleteProductMutation = useDeleteProduct();

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      toast.success("Product deleted successfully!");
      setProductToDelete(null);
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      let errorMessage = "Failed to delete product. Please try again.";

      if (axiosError?.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError?.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      }

      toast.error(errorMessage);
    }
  };
  const updateStatusMutation = useUpdateProductStatus();

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: productId, approval_status: newStatus });
      toast.success("Product status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update product status.");
    }
  };

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "pending", label: "Pending" },
  ];

  const getStatusDisplay = (status?: string) => {
    if (!status) return "—";
    if (status === "pending_review" || status === "pending") return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (products.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }

  const getPrice = (product: Product) => {
    const price = product.base_price ?? product.basePrice ?? product.price ?? 0;
    const currency = product.currency || "USD";
    return `${currency} ${
      typeof price === "number"
        ? price.toFixed(2)
        : parseFloat(String(price)).toFixed(2)
    }`;
  };

  const getImageUrl = (product: Product) => {
    return normalizeImageUrl(product.image || product.imageUrl);
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full overflow-hidden mb-1">
          <div className={cn(
            "grid items-center gap-4 px-4 py-3 bg-transparent",
            fromVendor 
              ? "grid-cols-[60px_2fr_100px_80px_110px_130px]" 
              : "grid-cols-[60px_2fr_100px_80px_110px_130px_80px]"
          )}>
            <div className="text-sm font-semibold text-black">Image</div>
            <div className="text-sm font-semibold text-black">Name</div>
            <div className="text-sm font-semibold text-black">SKU</div>
            <div className="text-sm font-semibold text-black">Stock</div>
            <div className="text-sm font-semibold text-black">Base Price</div>
            <div className="text-sm font-semibold text-black">Approval Status</div>
            {!fromVendor && (
              <div className="text-sm text-center font-semibold text-black">Actions</div>
            )}
          </div>
        </div>

        <div className="w-full space-y-1">
          {products.map((product) => {
            const imageUrl = getImageUrl(product);
            const productLink = `/admin/products/${product.id}${
              fromVendor ? "?from=vendor" : ""
            }`;

            return (
              <div
                key={product.id}
                className="w-full overflow-hidden bg-bg-light transition-all hover:bg-muted/50 hover:shadow-sm"
              >
                <div className={cn(
                  "grid items-center gap-4 px-4 py-3",
                  fromVendor 
                    ? "grid-cols-[60px_2fr_100px_80px_110px_130px]" 
                    : "grid-cols-[60px_2fr_100px_80px_110px_130px_80px]"
                )}>
                  <Link href={productLink} className="block">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <Link
                    href={productLink}
                    className="font-medium text-foreground truncate cursor-pointer hover:underline"
                  >
                    {product.name}
                  </Link>
                  <Link
                    href={productLink}
                    className="text-sm text-foreground truncate cursor-pointer hover:underline"
                  >
                    {product.sku || "—"}
                  </Link>
                  <Link
                    href={productLink}
                    className="text-sm text-foreground cursor-pointer hover:underline"
                  >
                    {product.stock !== undefined && product.stock !== null
                      ? product.stock
                      : "—"}
                  </Link>
                  <Link
                    href={productLink}
                    className="text-sm text-foreground cursor-pointer hover:underline"
                  >
                    {getPrice(product)}
                  </Link>
                  
                  <div className="flex items-center">
                    <Select
                      value={product.approval_status === "pending_review" ? "pending" : (product.approval_status || "pending")}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      className={cn(
                        "h-8 text-xs w-30 font-semibold border px-2",
                        getStatusColor(product.approval_status || "pending")
                      )}
                      disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === product.id}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-background text-foreground">
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {!fromVendor && (
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product &quot;{productToDelete?.name}&quot; and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
