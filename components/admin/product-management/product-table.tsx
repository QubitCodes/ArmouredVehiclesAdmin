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
        <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(200px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Name
          </div>
          <div className="min-w-[200px] text-sm font-semibold text-black">
            Description
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Price
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black md:block">
            Category
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black lg:block">
            Created Date
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/admin/${product.id}`}
            className="block w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:shadow-sm cursor-pointer"
          >
            <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(200px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground truncate">{product.name}</div>
              <div className="text-foreground truncate">
                {product.description || "—"}
              </div>
              <div className="text-foreground">
                ${typeof product.price === 'number' 
                  ? product.price.toFixed(2) 
                  : parseFloat(String(product.price || '0')).toFixed(2)}
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
              <div className="hidden text-sm text-foreground md:block">
                {product.category || "—"}
              </div>
              <div className="hidden text-sm text-foreground lg:block">
                {new Date(product.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
