"use client";

import Link from "next/link";
import { Product } from "@/services/admin/product.service";

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }

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
          <Link
            key={product.id}
            href={`/admin/products/admin/${product.id}`}
            className="block w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:shadow-sm"
          >
            <div className="grid items-center grid-cols-[2fr_120px_130px_100px] gap-4 px-4 py-3">
              <div className="font-medium text-foreground truncate">
                {product.name}
              </div>
              <div className="text-sm text-foreground">
                {product.stock !== undefined && product.stock !== null 
                  ? product.stock 
                  : "—"}
              </div>
              <div className="text-sm text-foreground">
                ${typeof product.basePrice === 'number' 
                  ? product.basePrice.toFixed(2) 
                  : typeof product.price === 'number'
                  ? product.price.toFixed(2)
                  : parseFloat(String(product.basePrice || product.price || '0')).toFixed(2)}
              </div>
              <div>
                <span
                  className={`text-sm font-medium ${
                    product.status === "active" || !product.status
                      ? "text-green-600 dark:text-green-500"
                      : "text-orange-600 dark:text-orange-500"
                  }`}
                >
                  {product.status
                    ? product.status.charAt(0).toUpperCase() +
                      product.status.slice(1)
                    : "Active"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
