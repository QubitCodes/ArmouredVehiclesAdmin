"use client";

import { Suspense } from "react";
import { use } from "react";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import ProductDetailsView from "@/components/admin/product-management/product-details-view";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductViewPageProps {
    params: Promise<{ id: string; domain: string }>;
}

export default function ProductViewPage({ params }: ProductViewPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { data: product, isLoading } = useProduct(resolvedParams.id);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!product) {
        return <div className="text-center p-8 text-destructive">Product not found</div>;
    }

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2">
                            <Eye className="h-4 w-4" />
                            Preview
                        </Button>
                        <Link href={`/${resolvedParams.domain}/product/${resolvedParams.id}/update`}>
                            <Button className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit Product
                            </Button>
                        </Link>
                    </div>
                </div>

                <ProductDetailsView
                    productId={resolvedParams.id}
                    domain={resolvedParams.domain}
                    product={product}
                />
            </div>
        </Suspense>
    );
}
