"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    Package,
    Settings,
    ShoppingCart,
    Image as ImageIcon,
    Shield,
    ArrowLeft,
    Edit,
    ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useProduct } from "@/hooks/admin/product-management/use-product";

const SECTIONS = [
    { id: "basic-info", title: "Basic Information", icon: Package },
    { id: "technical", title: "Technical Specs", icon: Settings },
    { id: "pricing", title: "Pricing & Availability", icon: ShoppingCart },
    { id: "media", title: "Gallery & Uploads", icon: ImageIcon },
    { id: "declarations", title: "Declarations", icon: Shield },
];

export default function ProductAccordionDetail({ productId }: { productId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const domain = (params?.domain as string) || "admin";
    const { data: product, isLoading } = useProduct(productId);
    const [openSection, setOpenSection] = useState<string>(() => searchParams.get("section") || SECTIONS[0].id);

    if (isLoading) return <div className="flex justify-center items-center h-64"><Spinner size="xl" /></div>;
    if (!product) return <div className="text-center py-12">Product not found.</div>;

    const handleEdit = () => {
        const basePath = domain === "vendor" ? "/vendor/product" : "/admin/product";
        router.push(`${basePath}/${productId}/edit?section=${openSection}`);
    };

    // Helper for field access (consistent with form logic)
    const getVal = (k1: string, k2: string) => ((product as any)[k1] !== undefined ? (product as any)[k1] : (product as any)[k2]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Product Detail View</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`/product/${product.id}`, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public
                    </Button>
                    <Button onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                    </Button>
                </div>
            </div>

            <Accordion className="space-y-6">
                <AccordionItem id="basic-info" title="Basic Information" icon={Package} isOpen={openSection === "basic-info"} onToggle={() => setOpenSection(openSection === "basic-info" ? "" : "basic-info")}>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label>Name</Label><p className="font-medium">{product.name}</p></div>
                        <div><Label>SKU</Label><p className="font-medium">{product.sku || "N/A"}</p></div>
                        <div className="col-span-2"><Label>Description</Label><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "" }} /></div>
                    </div>
                </AccordionItem>

                <AccordionItem id="technical" title="Technical Specs" icon={Settings} isOpen={openSection === "technical"} onToggle={() => setOpenSection(openSection === "technical" ? "" : "technical")}>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div>
                            <Label>Dimensions</Label>
                            <p>
                                {getVal("dimensionLength", "dimension_length") || 0}x
                                {getVal("dimensionWidth", "dimension_width") || 0}x
                                {getVal("dimensionHeight", "dimension_height") || 0} {getVal("dimensionUnit", "dimension_unit") || "mm"}
                            </p>
                        </div>
                        <div className="col-span-3">
                            <Label>Technical Specs</Label>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: getVal("technicalDescription", "technical_description") || "No technical specs provided." }} />
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem id="pricing" title="Pricing & Availability" icon={ShoppingCart} isOpen={openSection === "pricing"} onToggle={() => setOpenSection(openSection === "pricing" ? "" : "pricing")}>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div><Label>Base Price</Label><p className="text-2xl font-bold text-primary">{product.currency} {getVal("basePrice", "base_price")}</p></div>
                        <div><Label>Stock Status</Label><p>{getVal("readyStockAvailable", "ready_stock_available") ? "In Stock" : "Pre-order"}</p></div>
                    </div>
                </AccordionItem>

                <AccordionItem id="media" title="Gallery & Uploads" icon={ImageIcon} isOpen={openSection === "media"} onToggle={() => setOpenSection(openSection === "media" ? "" : "media")}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(product.image || product.imageUrl) && <img src={(product.image || product.imageUrl) || ""} className="aspect-square rounded-lg object-cover border" alt="Main" />}
                        {product.gallery?.map((img: string, i: number) => (<img key={i} src={img} className="aspect-square rounded-lg object-cover border" alt={`Gallery ${i}`} />))}
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{children}</p>;
}
