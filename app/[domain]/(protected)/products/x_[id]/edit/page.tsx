"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/product-management/product-form";

function EditProductFormWrapper() {
  const params = useParams();
  const productId = params.id as string;
  return <ProductForm productId={productId} />;
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <EditProductFormWrapper />
    </Suspense>
  );
}
