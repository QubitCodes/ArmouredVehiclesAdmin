"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductAccordionDetail from "../../../../../components/admin/product-management/product-accordion-detail";

function DetailWrapper() {
    const params = useParams();
    const productId = params.id as string;
    return <ProductAccordionDetail productId={productId} />;
}

export default function ProductAccordionDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <DetailWrapper />
        </Suspense>
    );
}
