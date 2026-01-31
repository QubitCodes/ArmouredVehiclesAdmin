"use client";

import { Suspense } from "react";
import { use } from "react";
import ProductAccordionForm from "@/components/admin/product-management/product-accordion-form";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductViewPageProps {
    params: Promise<{ id: string; domain: string }>;
}

export default function ProductViewPage({ params }: ProductViewPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <Link href={`/${resolvedParams.domain}/product/${resolvedParams.id}/update`}>
                        <Button className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit Product
                        </Button>
                    </Link>
                </div>

                <ProductAccordionForm
                    productId={resolvedParams.id}
                    domain={resolvedParams.domain}
                    readOnly={true}
                />
            </div>
        </Suspense>
    );
}
