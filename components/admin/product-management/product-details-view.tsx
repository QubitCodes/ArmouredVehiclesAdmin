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
    const p = (product as any).data || product;
    const { data: specifications = [], isLoading: isLoadingSpecs } = useProductSpecifications(productId);
    const { data: mainCategories = [] } = useMainCategories();
    const { data: brands = [] } = useBrands();

    // Category Hierarchy Data Fetching - Support both camelCase and snake_case
    const mainCategoryId = p.mainCategoryId || (p as any).main_category_id;
    const categoryId = p.categoryId || (p as any).category_id;
    const subCategoryId = p.subCategoryId || (p as any).sub_category_id;
    const brandId = p.brandId || (p as any).brand_id;

    const { data: categories = [] } = useCategoriesByParent(mainCategoryId);
    const { data: subCategories = [] } = useCategoriesByParent(categoryId);

    const [openSections, setOpenSections] = useState<string[]>(["basic-info", "technical", "pricing", "uploads", "declarations"]);

    // Helpers
    const getCategoryName = (id?: number | string, list: any[] = []) => {
        if (!id) return "N/A";
        return list.find(c => c.id == id)?.name || "N/A";
    };
    const getBrandName = (id?: number | string) => {
        if (!id) return "N/A";
        return brands.find(b => b.id == id)?.name || "N/A";
    };
    const getCountryName = (code?: string) => COUNTRY_LIST.find(c => c.countryCode === code)?.name || code || "N/A";

    // Safe parser for array fields
    const safeParseArray = (value: any) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                // If it looks like a JSON array, parse it
                if (value.trim().startsWith('[')) {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) return parsed;
                }
                // Fallback for comma-separated strings if acceptable, or return empty
                return [];
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    // Parse JSON fields
    const pricingTiers = safeParseArray(p.pricing_tiers || (p as any).pricingTiers);
    const individualPricing = safeParseArray((p as any).individual_product_pricing || p.individualProductPricing);
    const gallery = safeParseArray(p.gallery || (p as any).gallery);
    const certifications = safeParseArray(p.certifications || (p as any).certifications);
    const features = safeParseArray(p.features || (p as any).features);
    const pricingTerms = safeParseArray((p as any).pricing_terms || p.pricingTerms);

    // Support snake_case for other fields
    const controlledItemType = p.controlledItemType || (p as any).controlled_item_type;
    const vehicleCompatibility = p.vehicleCompatibility || (p as any).vehicle_compatibility;
    const countryOfOrigin = p.countryOfOrigin || (p as any).country_of_origin;
    const packingCharge = p.packingCharge ?? (p as any).packing_charge ?? 0;
    const basePrice = p.basePrice ?? (p as any).base_price ?? 0;
    const stock = p.stock ?? (p as any).stock ?? 0;
    const minOrderQuantity = p.minOrderQuantity || (p as any).min_order_quantity || 1;
    const productionLeadTime = p.productionLeadTime ?? (p as any).production_lead_time;
    const requiresExportLicense = p.requiresExportLicense ?? (p as any).requires_export_license;
    const readyStockAvailable = p.readyStockAvailable ?? (p as any).ready_stock_available;
    const manufacturingSource = p.manufacturingSource || (p as any).manufacturing_source;
    const manufacturingSourceName = p.manufacturingSourceName || (p as any).manufacturing_source_name;
    const hasWarranty = p.hasWarranty ?? (p as any).has_warranty;
    const warrantyDuration = p.warrantyDuration ?? (p as any).warranty_duration;
    const warrantyDurationUnit = p.warrantyDurationUnit || (p as any).warranty_duration_unit;

    const renderBasicInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Column 1 */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Category Hierarchy</h3>
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                            <Badge variant="outline">{getCategoryName(mainCategoryId, mainCategories)}</Badge>
                            {categoryId && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <Badge variant="outline">{getCategoryName(categoryId, categories)}</Badge>
                                </>
                            )}
                            {subCategoryId && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <Badge variant="outline">{getCategoryName(subCategoryId, subCategories)}</Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Brand & Model</h3>
                        <p>{getBrandName(brandId)} {product.model ? `- ${product.model}` : ""} {product.year ? `(${product.year})` : ""}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Country of Origin</h3>
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{getCountryName(countryOfOrigin)}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Controlled Item Type</h3>
                        {controlledItemType ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {controlledItemType}
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
                            <span className="text-sm">{vehicleCompatibility || "Universal / Not Specified"}</span>
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
                {features.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Key Features</h3>
                        <div className="flex flex-wrap gap-2">
                            {features.map((f: string, i: number) => (
                                <Badge key={i} variant="outline" className="bg-background">{f}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {certifications.length > 0 && (
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4 bg-muted/20 rounded-lg border">
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Base Price</h3>
                    <p className="text-2xl font-bold text-primary">
                        {product.currency || "AED"} {(basePrice !== undefined && basePrice !== null) ? basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                    </p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Packing Charge</h3>
                    <p className="text-lg font-medium">
                        {product.currency || "AED"} {(packingCharge !== undefined && packingCharge !== null) ? packingCharge.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                    </p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Stock</h3>
                    <p className="text-lg font-medium">{(stock !== undefined && stock !== null) ? stock : 0} Units</p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Min Order Qty</h3>
                    <p className="text-lg font-medium">{(minOrderQuantity !== undefined && minOrderQuantity !== null) ? minOrderQuantity : 1}</p>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Lead Time</h3>
                    <p className="text-lg font-medium">{(productionLeadTime !== undefined && productionLeadTime !== null) ? `${productionLeadTime} days` : "N/A"}</p>
                </div>
            </div>

            {/* Pricing Terms */}
            {pricingTerms.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Pricing Terms</h3>
                    <div className="flex flex-wrap gap-2">
                        {pricingTerms.map((term: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                {term}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

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
                        <Badge variant={requiresExportLicense ? "destructive" : "secondary"}>
                            {requiresExportLicense ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Ready Stock Available</span>
                        <Badge variant={readyStockAvailable ? "default" : "secondary"}>
                            {readyStockAvailable ? "Yes" : "No"}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Compliance Confirmed</span>
                        {(p.complianceConfirmed || (p as any).compliance_confirmed) ? (
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
                            <span className="capitalize">{manufacturingSource || "N/A"}</span>
                            {manufacturingSourceName && (
                                <Badge variant="secondary">{manufacturingSourceName}</Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1 mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Warranty</p>
                        {hasWarranty ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="font-medium">
                                        {warrantyDuration} {warrantyDurationUnit}
                                    </span>
                                </div>
                                {((p as any).warranty_terms || (p as any).warrantyTerms || (p as any).warranty) && (
                                    <div className="space-y-1 mt-1 p-3 bg-muted/30 rounded text-sm">
                                        <p className="text-muted-foreground">
                                            {(p as any).warranty_terms || (p as any).warrantyTerms || (p as any).warranty}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">No Warranty Offered</span>
                        )}
                    </div>
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
