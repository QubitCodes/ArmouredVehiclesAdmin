"use client";

import Link from "next/link";
import { Product } from "@/services/vendor/product.service";

interface ProductTableProps {
  products: Product[];
}

export function VendorProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }

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
      <div className="w-full overflow-hidden mb-1">
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
            className="w-full overflow-hidden bg-bg-light transition-all hover:bg-muted/50 hover:shadow-sm"
          >
            <div className="grid items-center grid-cols-[2fr_120px_130px_100px] gap-4 px-4 py-3">
              <Link
                href={`/vendor/products/${product.id}`}
                className="font-medium text-foreground truncate cursor-pointer"
              >
                {product.name}
              </Link>
              <Link
                href={`/vendor/products/${product.id}`}
                className="text-sm text-foreground hover:underline cursor-pointer"
              >
                {product.stock !== undefined && product.stock !== null 
                  ? product.stock 
                  : "—"}
              </Link>
              <Link
                href={`/vendor/products/${product.id}`}
                className="text-sm text-foreground hover:underline cursor-pointer"
              >
                ${typeof product.basePrice === 'number' 
                  ? product.basePrice.toFixed(2) 
                  : typeof product.price === 'number'
                  ? product.price.toFixed(2)
                  : parseFloat(String(product.basePrice || product.price || '0')).toFixed(2)}
              </Link>
              <span className={`text-sm font-medium ${getStatusColor(product.status)}`}>
                {getStatusDisplay(product.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

