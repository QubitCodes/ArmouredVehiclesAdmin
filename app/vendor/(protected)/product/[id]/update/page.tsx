"use client";

import { Suspense } from "react";
import { use } from "react";
import ProductAccordionForm from "@/components/admin/product-management/product-accordion-form";
import { Spinner } from "@/components/ui/spinner";

interface ProductEditPageProps {
    params: Promise<{ id: string }>;
}

export default function VendorProductEditPage({ params }: ProductEditPageProps) {
    const resolvedParams = use(params);

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            }
        >
            <ProductAccordionForm
                productId={resolvedParams.id}
                domain="vendor"
            />
        </Suspense>
    );
}
