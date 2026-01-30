"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    ArrowLeft,
    Plus,
    X,
    Loader2,
    Trash2,
    Package,
    Settings,
    Save,
    Hash,
    ShoppingCart,
    Image as ImageIcon,
    Shield,
    UploadCloud,
    Eye,
    Info,
    Lock,
    CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { DateSelector } from "@/components/ui/date-selector";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { COUNTRY_LIST } from "@/lib/countries";
import { Spinner } from "@/components/ui/spinner";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
    useCreateProduct,
    useUpdateProduct,
    useDeleteProductMedia,
    useBulkDeleteProductMedia,
} from "@/hooks/admin/product-management/use-products";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import {
    useMainCategories,
    useCategoriesByParent,
} from "@/hooks/admin/product-management/use-categories";
import { EXTERNAL_COLORS } from "@/lib/external-colors";
import {
    useProductSpecifications,
    useCreateSpecification,
    useUpdateSpecification,
    useBulkUpdateSpecifications,
    useDeleteSpecification,
} from "@/hooks/admin/product-management/use-product-specifications";
import { useBrands } from "@/hooks/admin/use-references";
import { MultiSelect } from "@/components/ui/multi-select";
import type { ProductSpecification } from "@/services/admin/product-specification.service";
import type {
    CreateProductRequest,
    UpdateProductRequest,
    Product,
} from "@/services/admin/product.service";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// Import schemas and types from original form
import { AxiosError } from "axios";

// Pricing Tier Schema
const pricingTierSchema = z.object({
    min_quantity: z.coerce.number().int().nonnegative().optional().default(0),
    max_quantity: z.union([z.coerce.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
    price: z.coerce.number().nonnegative().optional().default(0),
});

// Combined schema
const productSchema = z.object({
    // Basic Info
    name: z.string().min(1, "Product name is required"),
    sku: z.string().optional(),
    mainCategoryId: z.number().optional(),
    categoryId: z.number().optional(),
    subCategoryId: z.number().optional(),
    vehicleCompatibility: z.string().optional(),
    certifications: z.array(z.string()).optional().default([]),
    countryOfOrigin: z.string().optional(),
    controlledItemType: z.string().optional(),
    description: z.string().optional(),
    brandId: z.coerce.number().optional().nullable(),
    model: z.string().optional(),
    year: z.coerce.number().optional(),
    condition: z.string().optional(),
    // Technical Specs (now without MOQ)
    dimensionLength: z.number().optional(),
    dimensionWidth: z.number().optional(),
    dimensionHeight: z.number().optional(),
    dimensionUnit: z.string().optional(),
    materials: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    performance: z.array(z.string()).optional(),
    technicalDescription: z.string().optional(),
    driveTypes: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    thickness: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    weightValue: z.number().optional(),
    weightUnit: z.string().optional(),
    packingLength: z.number().optional(),
    packingWidth: z.number().optional(),
    packingHeight: z.number().optional(),
    packingDimensionUnit: z.string().optional(),
    packingWeight: z.number().optional(),
    packingWeightUnit: z.string().optional(),
    vehicleFitment: z.array(z.string()).optional(),
    specifications: z.array(z.string()).optional(),
    // Pricing (now includes MOQ)
    basePrice: z.coerce.number().min(0).optional(),
    shippingCharge: z.coerce.number().min(0).optional(),
    packingCharge: z.coerce.number().min(0).optional(),
    currency: z.string().optional(),
    productionLeadTime: z.coerce.number().optional().nullable(),
    minOrderQuantity: z.number().optional(),
    stock: z.number().optional(),
    readyStockAvailable: z.boolean().optional(),
    pricingTerms: z.array(z.string()).optional(),
    pricing_tiers: z.array(pricingTierSchema).optional().default([]),
    individualProductPricing: z.array(z.object({ name: z.string(), amount: z.coerce.number() })).optional().default([]),
    // Media
    image: z.string().url().optional().or(z.literal("")),
    gallery: z.array(z.string().url()).optional(),
    // Declarations
    manufacturingSource: z.string().optional(),
    manufacturingSourceName: z.string().optional(),
    requiresExportLicense: z.boolean().optional(),
    hasWarranty: z.boolean().optional(),
    warrantyDuration: z.number().optional(),
    warrantyDurationUnit: z.string().optional(),
    warrantyTerms: z.string().optional(),
    complianceConfirmed: z.boolean().optional(),
    supplierSignature: z.string().optional(),
    warranty: z.string().optional(),
    signatureDate: z.any().optional(),
    status: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Section definitions
const SECTIONS = [
    {
        id: 1,
        name: "Basic Information",
        slug: "basic-info",
        icon: Package,
        requiredFields: ["name", "mainCategoryId", "description"],
    },
    {
        id: 2,
        name: "Technical Specifications",
        slug: "technical",
        icon: Settings,
        requiredFields: [],
    },
    {
        id: 3,
        name: "Pricing & Availability",
        slug: "pricing",
        icon: ShoppingCart,
        requiredFields: ["basePrice"],
    },
    {
        id: 4,
        name: "Uploads & Media",
        slug: "uploads",
        icon: ImageIcon,
        requiredFields: [],
    },
    {
        id: 5,
        name: "Declarations",
        slug: "declarations",
        icon: Shield,
        requiredFields: [],
    },
];

interface ProductAccordionFormProps {
    productId: string;
    domain: string;
}

export default function ProductAccordionForm({ productId, domain }: ProductAccordionFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // State
    const [openSections, setOpenSections] = useState<string[]>(["basic-info"]);
    const [unlockedSections, setUnlockedSections] = useState<number[]>([1]);
    const [currentProductId, setCurrentProductId] = useState<string | null>(productId === "new" ? null : productId);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
    const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);
    const [rowsToAdd, setRowsToAdd] = useState(1);

    // Data fetching
    const { data: product, isLoading: isLoadingProduct } = useProduct(currentProductId || "");
    const { data: mainCategories = [], isLoading: isLoadingCategories } = useMainCategories();
    const { data: brands = [], isLoading: isLoadingBrands } = useBrands();
    const { data: existingSpecs, isLoading: isLoadingSpecs } = useProductSpecifications(currentProductId || "");

    // Mutations
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const { mutateAsync: deleteMedia } = useDeleteProductMedia();
    const { mutateAsync: bulkDeleteMedia } = useBulkDeleteProductMedia();
    const createSpec = useCreateSpecification(currentProductId || "");
    const updateSpec = useUpdateSpecification(currentProductId || "");
    const deleteSpec = useDeleteSpecification(currentProductId || "");
    const bulkUpdateSpecs = useBulkUpdateSpecifications(currentProductId || "");

    // Form
    const form = useForm<ProductFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            sku: "",
            certifications: [],
            materials: [],
            features: [],
            performance: [],
            pricingTerms: [],
            pricing_tiers: [],
            individualProductPricing: [],
            gallery: [],
            status: "draft",
        },
    });

    // Watch form values
    const mainCategoryId = form.watch("mainCategoryId");
    const categoryId = form.watch("categoryId");
    const watchName = form.watch("name");
    const watchCategories = form.watch("mainCategoryId");
    const watchDesc = form.watch("description");
    const watchPrice = form.watch("basePrice");
    const watchStock = form.watch("stock");
    const gallery = form.watch("gallery") || [];
    const pricingTiers = form.watch("pricing_tiers") || [];

    // Cascading categories
    const { data: categories = [], isLoading: isLoadingSubCategories } = useCategoriesByParent(
        mainCategoryId ?? undefined
    );
    const { data: subCategories = [] } = useCategoriesByParent(
        categoryId ?? undefined
    );

    // Initialize form with product data
    useEffect(() => {
        if (product && currentProductId) {
            const p = product as Record<string, any>;
            form.reset({
                name: p.name || "",
                sku: p.sku || "",
                mainCategoryId: p.main_category_id || p.mainCategoryId,
                categoryId: p.category_id || p.categoryId,
                subCategoryId: p.sub_category_id || p.subCategoryId,
                vehicleCompatibility: p.vehicle_compatibility || "",
                certifications: Array.isArray(p.certifications) ? p.certifications : [],
                countryOfOrigin: p.country_of_origin || "",
                controlledItemType: p.controlled_item_type || "",
                description: p.description || "",
                brandId: p.brand_id || null,
                model: p.model || "",
                year: p.year,
                condition: p.condition || "",
                basePrice: p.base_price,
                shippingCharge: p.shipping_charge,
                packingCharge: p.packing_charge,
                currency: p.currency || "AED",
                productionLeadTime: p.production_lead_time,
                minOrderQuantity: p.min_order_quantity,
                stock: p.stock,
                readyStockAvailable: p.ready_stock_available,
                pricingTerms: Array.isArray(p.pricing_terms) ? p.pricing_terms : [],
                pricing_tiers: Array.isArray(p.pricing_tiers) ? p.pricing_tiers : [],
                individualProductPricing: Array.isArray(p.individual_product_pricing) ? p.individual_product_pricing : [],
                image: p.image || "",
                gallery: Array.isArray(p.gallery) ? p.gallery : [],
                manufacturingSource: p.manufacturing_source || "",
                manufacturingSourceName: p.manufacturing_source_name || "",
                requiresExportLicense: p.requires_export_license,
                hasWarranty: p.has_warranty,
                warranty: p.warranty || "",
                warrantyDuration: p.warranty_duration,
                warrantyDurationUnit: p.warranty_duration_unit || "Months",
                warrantyTerms: p.warranty_terms || "",
                complianceConfirmed: p.compliance_confirmed,
                supplierSignature: p.supplier_signature || "",
                signatureDate: p.submission_date ? {
                    day: new Date(p.submission_date).getDate(),
                    month: new Date(p.submission_date).getMonth() + 1,
                    year: new Date(p.submission_date).getFullYear(),
                } : undefined,
                status: p.status || "draft",
            });

            // Unlock all sections for existing products
            setUnlockedSections([1, 2, 3, 4, 5]);
            // Open all sections for existing products (user requested unlocked sections stay open)
            setOpenSections(SECTIONS.map(s => s.slug));
        }
    }, [product, currentProductId, form]);

    // Initialize specs
    useEffect(() => {
        if (existingSpecs && Array.isArray(existingSpecs)) {
            setLocalSpecs(existingSpecs.sort((a: any, b: any) => a.sort - b.sort));
        }
    }, [existingSpecs]);

    // Deep linking - scroll to section from URL hash
    useEffect(() => {
        const hash = window.location.hash.replace("#", "");
        if (hash) {
            const section = SECTIONS.find(s => s.slug === hash);
            if (section && unlockedSections.includes(section.id)) {
                setOpenSections([hash]);
                setTimeout(() => {
                    sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
            }
        }
    }, [unlockedSections]);

    // Check if section is complete
    const isSectionComplete = (sectionId: number): boolean => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section) return false;

        switch (sectionId) {
            case 1:
                return !!(watchName && watchCategories && watchDesc);
            case 2:
                return true; // Specs are optional
            case 3:
                return watchPrice !== undefined && watchPrice >= 0;
            case 4:
                return true; // Media is optional
            case 5:
                return true; // Declarations are optional
            default:
                return false;
        }
    };

    // Can publish validation
    const canPublish = !!(watchName && watchCategories && watchDesc && watchPrice !== undefined && watchPrice >= 0);

    // Handle section save and unlock next
    const handleSectionSave = async (sectionId: number) => {
        const formData = form.getValues();

        try {
            // Handle specs saving for section 2
            if (currentProductId && sectionId === 2) {
                if (localSpecs.length > 0) {
                    // Validate specs rules
                    if (localSpecs[0]?.type !== 'title_only') {
                        toast.warning('The first specification must always be a Section Title.');
                        return;
                    }
                    await bulkUpdateSpecs.mutateAsync(localSpecs);
                }
            }

            const cleanedData = cleanDataForApi(formData);
            const fd = new FormData();

            Object.keys(cleanedData).forEach(key => {
                const value = cleanedData[key];
                if (value === undefined || value === null) return;
                if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof File))) {
                    fd.append(key, JSON.stringify(value));
                } else {
                    fd.append(key, String(value));
                }
            });

            // Append files
            if (sectionId === 4) {
                if (coverImageFile) fd.append('files', coverImageFile);
                galleryFiles.forEach(file => fd.append('files', file));
            }

            if (!currentProductId) {
                // Create new product
                const response = await createProductMutation.mutateAsync(fd as unknown as CreateProductRequest);
                const newId = (response as any)?.id || (response as any)?.data?.id;
                if (newId) {
                    setCurrentProductId(String(newId));
                    toast.success("Product created successfully!");
                    // Unlock next section
                    if (!unlockedSections.includes(sectionId + 1) && sectionId < 5) {
                        setUnlockedSections(prev => [...prev, sectionId + 1]);
                    }
                    // Open next section
                    const nextSection = SECTIONS.find(s => s.id === sectionId + 1);
                    if (nextSection) {
                        setOpenSections([nextSection.slug]);
                        window.history.replaceState(null, "", `#${nextSection.slug}`);
                    }
                    // Navigate to edit URL
                    router.replace(`/${domain}/product/${newId}/update#${nextSection?.slug || 'technical'}`);
                }
            } else {
                // Update existing
                await updateProductMutation.mutateAsync({
                    id: currentProductId,
                    data: fd as unknown as UpdateProductRequest,
                });
                toast.success("Section saved successfully!");

                // Clear file states after successful upload
                if (sectionId === 4) {
                    setCoverImageFile(null);
                    setGalleryFiles([]);
                }

                // Unlock and open next section
                if (!unlockedSections.includes(sectionId + 1) && sectionId < 5) {
                    setUnlockedSections(prev => [...prev, sectionId + 1]);
                }
                const nextSection = SECTIONS.find(s => s.id === sectionId + 1);
                if (nextSection) {
                    setOpenSections([nextSection.slug]);
                    window.history.replaceState(null, "", `#${nextSection.slug}`);
                    setTimeout(() => {
                        sectionRefs.current[nextSection.slug]?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                }
            }
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            toast.error(axiosError?.response?.data?.message || "Failed to save. Please try again.");
        }
    };

    // Field mapping for API
    const FIELD_MAPPING: Record<string, string> = {
        vehicleFitment: 'vehicle_fitment',
        dimensionLength: 'dimension_length',
        dimensionWidth: 'dimension_width',
        dimensionHeight: 'dimension_height',
        dimensionUnit: 'dimension_unit',
        weightValue: 'weight_value',
        weightUnit: 'weight_unit',
        packingLength: 'packing_length',
        packingWidth: 'packing_width',
        packingHeight: 'packing_height',
        packingDimensionUnit: 'packing_dimension_unit',
        packingWeight: 'packing_weight',
        packingWeightUnit: 'packing_weight_unit',
        minOrderQuantity: 'min_order_quantity',
        pricingTerms: 'pricing_terms',
        productionLeadTime: 'production_lead_time',
        readyStockAvailable: 'ready_stock_available',
        manufacturingSource: 'manufacturing_source',
        manufacturingSourceName: 'manufacturing_source_name',
        requiresExportLicense: 'requires_export_license',
        hasWarranty: 'has_warranty',
        warrantyDuration: 'warranty_duration',
        warrantyDurationUnit: 'warranty_duration_unit',
        warrantyTerms: 'warranty_terms',
        complianceConfirmed: 'compliance_confirmed',
        supplierSignature: 'supplier_signature',
        signatureDate: 'submission_date',
        detailDescription: 'description',
        driveTypes: 'drive_types',
        technicalDescription: 'technical_description',
        controlledItemType: 'controlled_item_type',
        countryOfOrigin: 'country_of_origin',
        mainCategoryId: 'main_category_id',
        categoryId: 'category_id',
        subCategoryId: 'sub_category_id',
        basePrice: 'base_price',
        shippingCharge: 'shipping_charge',
        packingCharge: 'packing_charge',
        individualProductPricing: 'individual_product_pricing',
        brandId: 'brand_id',
        vehicleCompatibility: 'vehicle_compatibility',
    };

    const cleanDataForApi = (data: ProductFormValues): Record<string, unknown> => {
        const cleanedData: Record<string, unknown> = {};

        Object.keys(data).forEach(field => {
            const value = data[field as keyof ProductFormValues];
            const apiField = FIELD_MAPPING[field] || field;

            if (field === "signatureDate" && value && typeof value === "object") {
                const dateValue = value as { day?: number; month?: number; year?: number };
                if (dateValue.day && dateValue.month && dateValue.year) {
                    cleanedData[apiField] = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
                }
            } else if (field === "pricing_tiers" || field === "individualProductPricing") {
                if (value) cleanedData[apiField] = value;
            } else if (Array.isArray(value)) {
                const filtered = value.filter(item => item !== "");
                if (filtered.length > 0) cleanedData[apiField] = filtered;
            } else if (value !== "" && value !== undefined && value !== null) {
                cleanedData[apiField] = value;
            }
        });

        return cleanedData;
    };

    // Array helpers
    const addArrayItem = (fieldName: keyof ProductFormValues) => {
        const current = form.getValues(fieldName) || [];
        form.setValue(fieldName, [...(current as string[]), ""] as any);
    };

    const removeArrayItem = async (fieldName: keyof ProductFormValues, index: number) => {
        const current = form.getValues(fieldName) || [];

        if (fieldName === 'gallery') {
            const itemToDelete = (current as string[])[index];
            if (typeof itemToDelete === 'string' && itemToDelete.startsWith('http') && currentProductId) {
                const mediaItem = (product as any)?.media?.find((m: any) =>
                    m.url === itemToDelete || itemToDelete.endsWith(m.url)
                );
                if (mediaItem) {
                    try {
                        await deleteMedia({ productId: currentProductId, mediaId: String(mediaItem.id) });
                        toast.success("Image deleted successfully");
                    } catch (error) {
                        toast.error("Failed to delete image");
                        return;
                    }
                }
            }
        }

        form.setValue(
            fieldName,
            (current as string[]).filter((_, i) => i !== index) as any
        );
    };

    const updateArrayItem = (fieldName: keyof ProductFormValues, index: number, value: string) => {
        const current = form.getValues(fieldName) || [];
        const updated = [...(current as string[])];
        updated[index] = value;
        form.setValue(fieldName, updated as any);
    };

    // SKU generator
    const generateSku = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `SKU-${code}`;
    };

    const handleNameKeyUp = () => {
        const currentSku = form.getValues("sku");
        if (!currentProductId && !currentSku) {
            form.setValue("sku", generateSku(), { shouldValidate: true });
        }
    };

    // Pricing tier helpers
    const addPricingTier = () => {
        const current = form.getValues("pricing_tiers") || [];
        form.setValue("pricing_tiers", [...current, { min_quantity: 0, max_quantity: null, price: 0 }]);
    };

    const removePricingTier = (index: number) => {
        const current = form.getValues("pricing_tiers") || [];
        form.setValue("pricing_tiers", current.filter((_, i) => i !== index));
    };

    // Individual product pricing helpers
    const addIndividualProduct = () => {
        const current = form.getValues("individualProductPricing") || [];
        form.setValue("individualProductPricing", [...current, { name: "", amount: 0 }]);
    };

    const removeIndividualProduct = (index: number) => {
        const current = form.getValues("individualProductPricing") || [];
        form.setValue("individualProductPricing", current.filter((_, i) => i !== index));
    };

    const updateBasePrice = () => {
        const items = form.getValues("individualProductPricing") || [];
        const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        form.setValue("basePrice", total);
        toast.success(`Base price updated to ${total} based on individual costs.`);
    };

    // Render loading state
    if (productId !== "new" && isLoadingProduct) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6">
                <Button variant="outline" onClick={() => router.back()} className="w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {currentProductId ? "Edit Product" : "Add New Product"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Complete each section to build your product listing.
                    </p>
                </div>
                {currentProductId && (
                    <Button
                        variant="outline"
                        className="ml-auto"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"}/product/${currentProductId}`, "_blank")}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                )}
            </div>

            <Form {...form}>
                <form className="space-y-4">
                    <Accordion
                        type="multiple"
                        value={openSections}
                        onValueChange={(values) => {
                            setOpenSections(values);
                            // Update URL hash to the first open section
                            if (values.length > 0) {
                                window.history.replaceState(null, "", `#${values[values.length - 1]}`);
                            }
                        }}
                        className="space-y-4"
                    >
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isUnlocked = unlockedSections.includes(section.id);
                            const isComplete = isSectionComplete(section.id);
                            const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

                            return (
                                <div
                                    key={section.id}
                                    ref={(el) => { sectionRefs.current[section.slug] = el; }}
                                    id={section.slug}
                                >
                                    <AccordionItem
                                        value={section.slug}
                                        className={cn(
                                            "border border-border rounded-lg overflow-hidden bg-card",
                                            !isUnlocked && "opacity-60 pointer-events-none"
                                        )}
                                    >
                                        <AccordionTrigger
                                            className={cn(
                                                "px-6 py-4 hover:no-underline hover:bg-muted/50",
                                                !isUnlocked && "cursor-not-allowed"
                                            )}
                                            disabled={!isUnlocked}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    isComplete ? "bg-primary/10 text-primary" : "bg-muted"
                                                )}>
                                                    {!isUnlocked ? (
                                                        <Lock className="h-4 w-4" />
                                                    ) : isComplete ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : (
                                                        <Icon className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">{section.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {!isUnlocked
                                                            ? "Complete previous section to unlock"
                                                            : isComplete
                                                                ? "Section complete"
                                                                : "Fill in the details below"}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6 pt-2 bg-background/50">
                                            {/* Section content will be rendered here */}
                                            {section.id === 1 && renderBasicInfoSection()}
                                            {section.id === 2 && renderTechnicalSection()}
                                            {section.id === 3 && renderPricingSection()}
                                            {section.id === 4 && renderUploadsSection()}
                                            {section.id === 5 && renderDeclarationsSection()}

                                            {/* Section save button */}
                                            <div className="flex justify-end mt-6 pt-4 border-t">
                                                <Button
                                                    type="button"
                                                    onClick={() => handleSectionSave(section.id)}
                                                    disabled={isSaving || (section.id === 1 && !isSectionComplete(1))}
                                                >
                                                    {isSaving ? (
                                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                                    ) : section.id === 5 ? (
                                                        <><Save className="mr-2 h-4 w-4" /> Save & Finish</>
                                                    ) : (
                                                        <><Save className="mr-2 h-4 w-4" /> Save & Continue</>
                                                    )}
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </div>
                            );
                        })}
                    </Accordion>
                </form>
            </Form>
        </div>
    );

    // Section render functions
    function renderBasicInfoSection() {
        return (
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Clear title (e.g., BR6 Ballistic Glass Kit for Toyota LC300)"
                                    {...field}
                                    onKeyUp={handleNameKeyUp}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="mainCategoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Main Category *</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.onChange(val === "" ? undefined : parseInt(val));
                                            form.setValue("categoryId", undefined);
                                            form.setValue("subCategoryId", undefined);
                                        }}
                                        disabled={isLoadingCategories}
                                    >
                                        <option value="">Select Main Category</option>
                                        {mainCategories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.onChange(val === "" ? undefined : parseInt(val));
                                            form.setValue("subCategoryId", undefined);
                                        }}
                                        disabled={!mainCategoryId || isLoadingSubCategories}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="subCategoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subcategory</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.onChange(val === "" ? undefined : parseInt(val));
                                        }}
                                        disabled={!categoryId}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {subCategories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Code / SKU (Auto-generated)</FormLabel>
                            <FormControl>
                                <Input {...field} readOnly className="bg-muted text-muted-foreground" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand</FormLabel>
                                <FormControl>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.onChange(val === "" ? null : parseInt(val));
                                        }}
                                        disabled={isLoadingBrands}
                                    >
                                        <option value="">Select Brand</option>
                                        {brands.map((brand: any) => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={(val) => field.onChange(val)}
                                    onFileUpload={async (file) => {
                                        if (!currentProductId) {
                                            toast.error("Please save the basic information first before uploading files.");
                                            throw new Error("Product ID required");
                                        }

                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('label', 'PRODUCT_DESCRIPTION_MEDIA');
                                        formData.append('data', JSON.stringify({ product_id: currentProductId }));

                                        const response = await api.post('/upload/files', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });

                                        if (response.data?.status && Array.isArray(response.data?.data) && response.data.data.length > 0) {
                                            const filePath = response.data.data[0];
                                            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
                                            const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '');
                                            return {
                                                url: `${baseUrl}/${filePath}`,
                                                type: file.type.startsWith('image/') ? 'image' : 'file',
                                                name: file.name
                                            };
                                        }
                                        throw new Error("Invalid response from server");
                                    }}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        );
    }

    function renderTechnicalSection() {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 items-start">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary">Technical Specifications</p>
                        <p className="text-xs text-muted-foreground">
                            Add detailed specifications for your product. Use the specifications table below for structured data.
                        </p>
                    </div>
                </div>

                {currentProductId && (
                    <div className="text-sm text-muted-foreground">
                        Specifications table is available for this product. Use the full form editor for detailed spec management.
                    </div>
                )}
            </div>
        );
    }

    function renderPricingSection() {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base Price *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <FormControl>
                                    <Select value={field.value || "AED"} onChange={field.onChange}>
                                        <option value="AED">AED</option>
                                        <option value="USD">USD</option>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stock</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="minOrderQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Minimum Order Quantity (MOQ)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="shippingCharge"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Shipping Charge</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="packingCharge"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Packing Charge</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="readyStockAvailable"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ready Stock Available?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={field.value ? "yes" : "no"}
                                    onValueChange={(val) => field.onChange(val === "yes")}
                                    className="flex gap-4"
                                >
                                    <RadioGroupItem value="yes" label="Yes" />
                                    <RadioGroupItem value="no" label="No" />
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        );
    }

    function renderUploadsSection() {
        const coverPreview = coverImageFile
            ? URL.createObjectURL(coverImageFile)
            : form.watch('image');

        return (
            <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">Cover Image</FormLabel>
                            <FormControl>
                                <div
                                    className={cn(
                                        "relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[250px] cursor-pointer transition-all duration-200",
                                        coverPreview ? "border-primary/50 bg-accent/10" : "border-border hover:border-primary/50 hover:bg-accent/5"
                                    )}
                                    onClick={() => document.getElementById('cover-upload-input')?.click()}
                                >
                                    {coverPreview ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img src={coverPreview} alt="Cover Preview" className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white font-medium">
                                                Click to Change
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <div className="p-4 bg-background rounded-full shadow-sm mx-auto w-fit">
                                                <UploadCloud className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium">Click to upload cover image</p>
                                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                            </div>
                                        </div>
                                    )}
                                    <Input
                                        id="cover-upload-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setCoverImageFile(file);
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <Label className="text-base font-semibold">Gallery Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {gallery.map((item, index) => (
                            <div key={`existing-${index}`} className="group relative aspect-square border rounded-xl overflow-hidden bg-background shadow-sm">
                                <img src={item} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                    onClick={() => removeArrayItem('gallery', index)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}

                        {galleryFiles.map((file, i) => (
                            <div key={`new-${i}`} className="group relative aspect-square border-2 border-primary/50 rounded-xl overflow-hidden bg-background shadow-sm">
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                    onClick={() => {
                                        const newFiles = [...galleryFiles];
                                        newFiles.splice(i, 1);
                                        setGalleryFiles(newFiles);
                                    }}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-medium shadow-sm pointer-events-none">
                                    New
                                </div>
                            </div>
                        ))}

                        <label className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-200 group">
                            <div className="p-3 bg-accent/20 group-hover:bg-primary/10 rounded-full transition-colors mb-2">
                                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Add Image</span>
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        // Prevent duplicates
                                        const existingUrls = new Set(gallery);
                                        const newFiles = Array.from(e.target.files).filter(file => {
                                            const url = URL.createObjectURL(file);
                                            return !existingUrls.has(url);
                                        });
                                        setGalleryFiles(prev => [...prev, ...newFiles]);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    function renderDeclarationsSection() {
        return (
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="manufacturingSource"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Manufacturing Source</FormLabel>
                            <FormControl>
                                <Select value={field.value || ""} onChange={field.onChange}>
                                    <option value="">Select</option>
                                    <option value="In-House">In-House</option>
                                    <option value="Sourced">Sourced</option>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}
                />

                {form.watch("manufacturingSource") === "Sourced" && (
                    <FormField
                        control={form.control}
                        name="manufacturingSourceName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Source Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="requiresExportLicense"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Requires Export License?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={field.value ? "yes" : "no"}
                                    onValueChange={(val) => field.onChange(val === "yes")}
                                    className="flex gap-4"
                                >
                                    <RadioGroupItem value="yes" label="Yes" />
                                    <RadioGroupItem value="no" label="No" />
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="hasWarranty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Has Warranty?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    value={field.value ? "yes" : "no"}
                                    onValueChange={(val) => field.onChange(val === "yes")}
                                    className="flex gap-4"
                                >
                                    <RadioGroupItem value="yes" label="Yes" />
                                    <RadioGroupItem value="no" label="No" />
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />

                {form.watch("hasWarranty") && (
                    <>
                        <FormField
                            control={form.control}
                            name="warranty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Warranty Details</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="warrantyDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="warrantyDurationUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl>
                                            <Select value={field.value || "Months"} onChange={field.onChange}>
                                                <option value="Months">Months</option>
                                                <option value="Years">Years</option>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="space-y-3 p-4 border border-border rounded-md bg-muted/20">
                            <FormLabel className="text-base font-semibold">Publish Status</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value || "draft"}
                                    className="flex flex-col space-y-1"
                                >
                                    <RadioGroupItem value="draft" label="Draft (Hidden from approval)" />
                                    <RadioGroupItem value="published" label="Published (Submit for Approval)" disabled={!canPublish} />
                                </RadioGroup>
                            </FormControl>
                            {!canPublish && (
                                <div className="text-xs text-destructive mt-2">
                                    To publish, please ensure the following are filled: Name, Category, Description, Price.
                                </div>
                            )}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="complianceConfirmed"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-md">
                            <FormControl>
                                <input
                                    type="checkbox"
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                    className="h-4 w-4"
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>I confirm compliance with all applicable regulations</FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        );
    }
}
