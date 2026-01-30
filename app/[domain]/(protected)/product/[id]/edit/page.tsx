"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductAccordionForm from "../../../../../../components/admin/product-management/product-accordion-form";

function EditWrapper() {
    const params = useParams();
    const productId = params.id as string;
    return <ProductAccordionForm productId={productId} />;
}

export default function EditProductAccordionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <EditWrapper />
        </Suspense>
    );
}
