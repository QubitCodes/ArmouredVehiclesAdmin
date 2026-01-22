"use client";

import { Suspense } from "react";
import ProductForm from "@/components/admin/product-management/product-form";

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}
