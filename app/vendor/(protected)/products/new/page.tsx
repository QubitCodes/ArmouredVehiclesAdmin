"use client";

import ProductForm from "@/components/admin/product-management/product-form";

export default function VendorNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product for your catalog
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
