"use client";

import { useState } from "react";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import { useProductSpecifications } from "@/hooks/admin/product-management/use-product-specifications";
import { useMainCategories, useCategoriesByParent } from "@/hooks/admin/product-management/use-categories";
import { useBrands } from "@/hooks/admin/use-references";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Package,
    Settings,
    ShoppingCart,
    ImageIcon,
    Shield,
    CheckCircle2,
    XCircle,
    FileText,
    Info,
    Globe,
    Truck,
    AlertTriangle
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Product } from "@/services/admin/product.service";
import { COUNTRY_LIST } from "@/lib/countries";

interface ProductDetailsViewProps {
    productId: string;
    domain: string;
    product: Product;
}

const SECTIONS = [
    { id: "basic-info", name: "Basic Information", icon: Package },
    { id: "technical", name: "Technical Specifications", icon: Settings },
    { id: "pricing", name: "Pricing & Availability", icon: ShoppingCart },
    { id: "uploads", name: "Uploads & Media", icon: ImageIcon },
    { id: "declarations", name: "Declarations", icon: Shield },
];

export default function ProductDetailsView({ productId, domain, product }: ProductDetailsViewProps) {
    const { data: specifications = [], isLoading: isLoadingSpecs } = useProductSpecifications(productId);
    const { data: mainCategories = [] } = useMainCategories();
    const { data: brands = [] } = useBrands();

    // Category Hierarchy Data Fetching
    const { data: categories = [] } = useCategoriesByParent(product.mainCategoryId);
    const { data: subCategories = [] } = useCategoriesByParent(product.categoryId);

    const [openSections, setOpenSections] = useState<string[]>(["basic-info", "technical", "pricing", "uploads", "declarations"]);

    // Helpers
    const getCategoryName = (id?: number, list: any[] = []) => list.find(c => c.id === id)?.name || "N/A";
    const getBrandName = (id?: number) => brands.find(b => b.id === id)?.name || "N/A";
    const getCountryName = (code?: string) => COUNTRY_LIST.find(c => c.countryCode === code)?.name || code || "N/A";

    // Parse JSON fields if necessary (usually handled by hook/service, but safeguarding)
    const pricingTiers = product.pricing_tiers || [];
    const individualPricing = product.individualProductPricing || [];
    const gallery = product.gallery || [];
    const certifications = product.certifications || [];
    const features = product.features || [];

    const renderBasicInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Column 1 */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Category Hierarchy</h3>
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                            <Badge variant="outline">{getCategoryName(product.mainCategoryId, mainCategories)}</Badge>
                            {product.categoryId && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <Badge variant="outline">{getCategoryName(product.categoryId, categories)}</Badge>
                                </>
                            )}
                            {product.subCategoryId && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <Badge variant="outline">{getCategoryName(product.subCategoryId, subCategories)}</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Brand & Model</h3>
                        <p>{getBrandName(product.brandId)} {product.model ? `- ${product.model}` : ""} {product.year ? `(${product.year})` : ""}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Country of Origin</h3>
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{getCountryName(product.countryOfOrigin)}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Controlled Item Type</h3>
                        {product.controlledItemType ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {product.controlledItemType}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                    </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">SKU</h3>
                        <p className="font-mono">{product.sku || "N/A"}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Condition</h3>
                        <Badge variant="secondary" className="capitalize">{product.condition || "New"}</Badge>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Vehicle Compatibility</h3>
                        <div className="flex items-start gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{product.vehicleCompatibility || "Universal / Not Specified"}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                        <Badge
                            variant={product.status === 'published' ? 'default' : 'secondary'}
                            className={cn("capitalize", product.status === 'published' ? 'bg-green-600 hover:bg-green-700' : '')}
                        >
                            {product.status || "Draft"}
                        </Badge>
                    </div>
                </div>
            </div>

            {product.description && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <div
                        className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/10 dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </div>
            )}

            {/* Features & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(features) && features.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Key Features</h3>
                        <div className="flex flex-wrap gap-2">
                            {features.map((f: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-background">{f}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {Array.isArray(certifications) && certifications.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                            {certifications.map((c: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {c}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTechnicalSpecs = () => (
        <div className="space-y-4">
            {isLoadingSpecs ? (
                <Spinner />
            ) : !Array.isArray(specifications) || specifications.length === 0 ? (
                <p className="text-muted-foreground italic">No technical specifications defined.</p>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[40%]">Specification</TableHead>
                                <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {specifications.map((spec: any, idx: number) => {
                                if (spec.type === 'title_only') {
                                    return (
                                        <TableRow key={idx} className="bg-muted/30">
                                            <TableCell colSpan={2} className="font-semibold text-primary py-3">
                                                {spec.label}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                                return (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {spec.type === 'value_only' ? (
                                                <span className="italic">Detail</span>
                                            ) : (
                                                spec.label
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {spec.type === 'value_only' ? (
                                                <div className="flex items-start gap-2">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                    <span>{spec.value}</span>
                                                </div>
                                            ) : (
                                                spec.value
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );

    const renderPricing = () => (
        <div className="space-y-8">
            {/* Base Pricing Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-muted/20 rounded-lg border">
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Base Price</h3>
                    <p className="text-2xl font-bold text-primary">
                        {product.currency} {product.basePrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Stock</h3>
                    <p className="text-lg font-medium">{product.stock || 0} Units</p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Min Order Qty</h3>
                    <p className="text-lg font-medium">{product.minOrderQuantity || 1}</p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lead Time</h3>
                    <p className="text-lg font-medium">{product.productionLeadTime || "N/A"} days</p>
                </div>
            </div>

            {/* Wholesale Tiers */}
            {Array.isArray(pricingTiers) && pricingTiers.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Wholesale Pricing Tiers
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Min Qty</TableHead>
                                    <TableHead>Max Qty</TableHead>
                                    <TableHead className="text-right">Unit Price ({product.currency})</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pricingTiers.map((tier: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>{tier.min_quantity}</TableCell>
                                        <TableCell>{tier.max_quantity || "∞"}</TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {tier.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Individual Product Pricing */}
            {Array.isArray(individualPricing) && individualPricing.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Bundle/Individual Component Pricing
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Component Name</TableHead>
                                    <TableHead className="text-right">Amount ({product.currency})</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {individualPricing.map((item: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUploads = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Cover Image</h3>
                {product.image ? (
                    <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border bg-muted">
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center aspect-video w-full max-w-md rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                        No cover image
                    </div>
                )}
            </div>

            {Array.isArray(gallery) && gallery.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {gallery.map((url: string, idx: number) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                                <Image
                                    src={url}
                                    alt={`Gallery image ${idx + 1}`}
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderDeclarations = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Compliance & Safety</h3>

                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Requires Export License</span>
                        <Badge variant={product.requiresExportLicense ? "destructive" : "secondary"}>
                            {product.requiresExportLicense ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Ready Stock Available</span>
                        <Badge variant={product.readyStockAvailable ? "default" : "secondary"}>
                            {product.readyStockAvailable ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Compliance Confirmed</span>
                        {product.complianceConfirmed ? (
                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-red-200 text-red-500 bg-red-50">
                                <XCircle className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Warranty & Origin</h3>

                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Manufacturing Source</p>
                        <div className="flex items-center gap-2">
                            <span className="capitalize">{product.manufacturingSource || "N/A"}</span>
                            {product.manufacturingSourceName && (
                                <Badge variant="secondary">{product.manufacturingSourceName}</Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1 mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Warranty</p>
                        {product.hasWarranty ? (
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-medium">
                                    {product.warrantyDuration} {product.warrantyDurationUnit}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">No Warranty Offered</span>
                        )}
                    </div>

                    {product.warrantyTerms && (
                        <div className="space-y-1 mt-4 p-3 bg-muted/30 rounded text-sm">
                            <p className="font-medium mb-1">Warranty Terms:</p>
                            <p className="text-muted-foreground">{product.warrantyTerms}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-4"
        >
            {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                    <div key={section.id} id={section.id} className="border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm">
                        <AccordionItem value={section.id} className="border-none">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:border-b">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="text-left font-semibold">
                                        {section.name}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-6 animate-in fade-in-50">
                                {section.id === "basic-info" && renderBasicInfo()}
                                {section.id === "technical" && renderTechnicalSpecs()}
                                {section.id === "pricing" && renderPricing()}
                                {section.id === "uploads" && renderUploads()}
                                {section.id === "declarations" && renderDeclarations()}
                            </AccordionContent>
                        </AccordionItem>
                    </div>
                );
            })}
        </Accordion>
    );
}
