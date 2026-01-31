"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductAccordionForm from "@/components/admin/product-management/product-accordion-form";
import { Spinner } from "@/components/ui/spinner";

export default function AdminNewProductPage() {
    const params = useParams();
    const domain = (params?.domain as string) || "admin";

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            }
        >
            <ProductAccordionForm
                productId="new"
                domain={domain}
            />
        </Suspense>
    );
}
