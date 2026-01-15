"use client";

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Product } from "@/services/admin/product.service";
import { normalizeImageUrl } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  fromVendor?: boolean;
}

export function ProductTable({
  products,
  fromVendor = false,
}: ProductTableProps) {
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
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[60px_2fr_120px_80px_130px] gap-4 px-4 py-3 bg-transparent">
          <div className="text-sm font-semibold text-black">Image</div>
          <div className="text-sm font-semibold text-black">Name</div>
          <div className="text-sm font-semibold text-black">SKU</div>
          <div className="text-sm font-semibold text-black">Stock</div>
          <div className="text-sm font-semibold text-black">Base Price</div>
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
              <div className="grid items-center grid-cols-[60px_2fr_120px_80px_130px] gap-4 px-4 py-3">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
