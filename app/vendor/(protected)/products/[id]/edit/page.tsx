"use client";

import { use } from "react";
import ProductForm from "@/components/admin/product-management/product-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function VendorEditProductPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product details and configuration
        </p>
      </div>

      <ProductForm productId={resolvedParams.id} />
    </div>
  );
}
