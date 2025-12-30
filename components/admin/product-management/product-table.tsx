"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ChevronDown, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product, productService } from "@/services/admin/product.service";

interface ProductTableProps {
  products: Product[];
  fromVendor?: boolean;
}

export function ProductTable({ products, fromVendor = false }: ProductTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await productService.updateProductStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  if (products.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      setUpdatingId(productId);
      await updateStatusMutation.mutateAsync({ id: productId, status });
      toast.success(`Product ${status === "approved" ? "approved" : "rejected"} successfully`);
      router.refresh();
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (status === "draft") return "Pending";
    if (status) return status.charAt(0).toUpperCase() + status.slice(1);
    return "Active";
  };

  const getStatusColor = (status?: string) => {
    if (status === "approved" || !status) return "text-green-600 dark:text-green-500";
    if (status === "draft") return "text-yellow-600 dark:text-yellow-500";
    if (status === "rejected") return "text-red-600 dark:text-red-500";
    return "text-orange-600 dark:text-orange-500";
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-lg mb-1">
        <div className="grid items-center grid-cols-[2fr_120px_130px_100px] gap-4 px-4 py-3 bg-transparent">
          <div className="text-sm font-semibold text-black">
            Name
          </div>
          <div className="text-sm font-semibold text-black">
            Stock
          </div>
          <div className="text-sm font-semibold text-black">
            Base Price
          </div>
          <div className="text-sm font-semibold text-black">
            Status
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:bg-muted/50 hover:shadow-sm"
          >
            <div className="grid items-center grid-cols-[2fr_120px_130px_100px] gap-4 px-4 py-3">
              <Link
                href={`/admin/products/${product.id}${fromVendor ? '?from=vendor' : ''}`}
                className="font-medium text-foreground truncate cursor-pointer"
              >
                {product.name}
              </Link>
              <Link
                href={`/admin/products/${product.id}${fromVendor ? '?from=vendor' : ''}`}
                className="text-sm text-foreground hover:underline cursor-pointer"
              >
                {product.stock !== undefined && product.stock !== null 
                  ? product.stock 
                  : "—"}
              </Link>
              <Link
                href={`/admin/products/${product.id}${fromVendor ? '?from=vendor' : ''}`}
                className="text-sm text-foreground hover:underline cursor-pointer"
              >
                ${typeof product.basePrice === 'number' 
                  ? product.basePrice.toFixed(2) 
                  : typeof product.price === 'number'
                  ? product.price.toFixed(2)
                  : parseFloat(String(product.basePrice || product.price || '0')).toFixed(2)}
              </Link>
              <div onClick={(e) => e.stopPropagation()}>
                {fromVendor ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={updatingId === product.id}
                      className="flex items-center gap-1 outline-none"
                    >
                      <span
                        className={`text-sm font-medium ${getStatusColor(product.status)} ${
                          updatingId === product.id ? "opacity-50" : ""
                        }`}
                      >
                        {updatingId === product.id ? "Updating..." : getStatusDisplay(product.status)}
                      </span>
                      {updatingId !== product.id && (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(product.id, "approved")}
                        className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/20"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(product.id, "draft")}
                        className="flex items-center gap-2 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                      >
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(product.id, "rejected")}
                        className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className={`text-sm font-medium ${getStatusColor(product.status)}`}>
                    {getStatusDisplay(product.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
