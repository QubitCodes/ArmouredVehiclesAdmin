"use client";

import { Suspense } from "react";
import ProductAccordionForm from "../../../../../components/admin/product-management/product-accordion-form";

export default function NewProductAccordionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <ProductAccordionForm isNew />
        </Suspense>
    );
}
