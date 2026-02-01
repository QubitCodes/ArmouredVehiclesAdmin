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
import { DraftAlert } from "@/components/admin/product-management/draft-alert";

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
                <div className="flex flex-col gap-4 border-b pb-4">
                    <div className="flex items-start gap-4">
                        <h1 className="text-2xl font-bold tracking-tight break-words">{product.name}</h1>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="gap-2 shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"}/product/${resolvedParams.id}`, "_blank")}
                            >
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
                </div>

                <DraftAlert
                    status={product.status}
                    product={{
                        name: product.name,
                        mainCategoryId: product.mainCategoryId,
                        description: product.description,
                        basePrice: product.basePrice || product.base_price,
                        hasCoverImage: !!product.image,
                        complianceConfirmed: !!product.complianceConfirmed || !!(product as any).compliance_confirmed
                    }}
                />

                <ProductDetailsView
                    productId={resolvedParams.id}
                    domain={resolvedParams.domain}
                    product={product}
                />
            </div>
        </Suspense >
    );
}
