"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    ArrowLeft, Plus, X, Loader2, Trash2, Package, Settings, Save, Hash,
    ShoppingCart, Image as ImageIcon, Shield, UploadCloud, Eye, Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn-select";
import { DateSelector } from "@/components/ui/date-selector";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { MultiSelect } from "@/components/ui/multi-select";
import { COUNTRY_LIST } from "@/lib/countries";
import { EXTERNAL_COLORS } from "@/lib/external-colors";
import api from "@/lib/api";

import { useCreateProduct, useUpdateProduct, useDeleteProductMedia, useBulkDeleteProductMedia } from "@/hooks/admin/product-management/use-products";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import { useMainCategories, useCategoriesByParent } from "@/hooks/admin/product-management/use-categories";
import { useProductSpecifications, useBulkUpdateSpecifications, useDeleteSpecification } from "@/hooks/admin/product-management/use-product-specifications";
import { useProductColors, useBrands } from "@/hooks/admin/use-references";

import type { ProductSpecification } from "@/services/admin/product-specification.service";
import type { CreateProductRequest, UpdateProductRequest, Product } from "@/services/admin/product.service";

// ============================================================================
// SCHEMAS
// ============================================================================

const pricingTierSchema = z.object({
    min_quantity: z.coerce.number().int().nonnegative().optional().default(0),
    max_quantity: z.union([z.coerce.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
    price: z.coerce.number().nonnegative().optional().default(0),
});

const basicInfoSchema = z.object({
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
    actionType: z.string().optional(),
    isFeatured: z.boolean().optional(),
});

const specificationsSchema = z.object({
    dimensionLength: z.number().optional(),
    dimensionWidth: z.number().optional(),
    dimensionHeight: z.number().optional(),
    dimensionUnit: z.string().optional(),
    technicalDescription: z.string().optional(),
    weightValue: z.number().optional(),
    weightUnit: z.string().optional(),
    packingLength: z.number().optional(),
    packingWidth: z.number().optional(),
    packingHeight: z.number().optional(),
    packingDimensionUnit: z.string().optional(),
    packingWeight: z.number().optional(),
    packingWeightUnit: z.string().optional(),
    minOrderQuantity: z.number().optional(),
});

const pricingSchema = z.object({
    basePrice: z.coerce.number().min(0).optional(),
    shippingCharge: z.coerce.number().min(0).optional(),
    packingCharge: z.coerce.number().min(0).optional(),
    currency: z.string().optional(),
    productionLeadTime: z.coerce.number().optional().nullable(),
    stock: z.number().optional(),
    readyStockAvailable: z.boolean().optional(),
    pricingTerms: z.array(z.string()).optional(),
    pricing_tiers: z.array(pricingTierSchema).optional().default([]),
    individualProductPricing: z.array(z.object({ name: z.string(), amount: z.coerce.number() })).optional().default([]),
});

const mediaSchema = z.object({
    image: z.string().url().optional().or(z.literal("")),
    gallery: z.array(z.string().url()).optional(),
});

const declarationsSchema = z.object({
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

const productSchema = basicInfoSchema.merge(specificationsSchema).merge(pricingSchema).merge(mediaSchema).merge(declarationsSchema);
export type ProductFormValues = z.infer<typeof productSchema>;

const SCHEMA_MAP: Record<string, z.ZodObject<any>> = {
    "basic-info": basicInfoSchema,
    "technical": specificationsSchema,
    "pricing": pricingSchema,
    "uploads": mediaSchema,
    "declarations": declarationsSchema,
};

const SECTIONS = [
    { id: "basic-info", title: "Basic Information", icon: Package },
    { id: "technical", title: "Technical Specifications", icon: Settings },
    { id: "pricing", title: "Pricing & Availability", icon: ShoppingCart },
    { id: "uploads", title: "Uploads & Media", icon: ImageIcon },
    { id: "declarations", title: "Declarations", icon: Shield },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface ProductAccordionFormProps {
    productId?: string;
    isVendor?: boolean;
}

export default function ProductAccordionForm({ productId, isVendor = false }: ProductAccordionFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const domain = (params?.domain as string) || "admin";

    // State
    const [currentProductId, setCurrentProductId] = useState<string | null>(productId || null);
    const [openSection, setOpenSection] = useState<string>(() => searchParams.get("section") || SECTIONS[0].id);
    const [unlockedSections, setUnlockedSections] = useState<Set<string>>(() => {
        const initial = new Set([SECTIONS[0].id]);
        if (productId) SECTIONS.forEach(s => initial.add(s.id));
        return initial;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
    const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);
    const [rowsToAdd, setRowsToAdd] = useState<number>(1);
    const initializedId = useRef<string | null>(null);
    const activeTabRef = useRef(openSection);
    const productIdRef = useRef(currentProductId);

    // Queries
    const { data: product, isLoading: isLoadingProduct } = useProduct(currentProductId || "");
    const { data: mainCategories = [] } = useMainCategories();
    const { data: specificationsData = [], isLoading: isLoadingSpecs } = useProductSpecifications(currentProductId);
    const { data: brands = [], isLoading: isLoadingBrands } = useBrands();

    // Mutations
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const { mutateAsync: deleteMedia } = useDeleteProductMedia();
    const { mutateAsync: bulkDeleteMedia } = useBulkDeleteProductMedia();
    const bulkUpdateSpecs = useBulkUpdateSpecifications(currentProductId);
    const deleteSpec = useDeleteSpecification(currentProductId);

    // Update refs
    useEffect(() => { activeTabRef.current = openSection; }, [openSection]);
    useEffect(() => { productIdRef.current = currentProductId; }, [currentProductId]);
    useEffect(() => {
        if (specificationsData.length > 0) setLocalSpecs(specificationsData);
        else if (currentProductId && localSpecs.length === 0) setLocalSpecs([{ label: '', value: '', type: 'title_only', active: false, sort: 0 }]);
    }, [specificationsData, currentProductId]);

    // Form setup with dynamic resolver
    const form = useForm<ProductFormValues>({
        resolver: (async (data, context, options) => {
            const isEditMode = !!productIdRef.current;
            const tabId = activeTabRef.current;
            const schema = isEditMode && SCHEMA_MAP[tabId] ? SCHEMA_MAP[tabId] : productSchema;
            const resolverFunc = zodResolver(schema);
            return (resolverFunc as any)(data, context, options);
        }) as Resolver<ProductFormValues>,
        shouldUnregister: false,
        mode: "onChange",
        defaultValues: {
            name: "",
            sku: "",
            mainCategoryId: undefined,
            categoryId: undefined,
            subCategoryId: undefined,
            certifications: [],
            controlledItemType: "",
            vehicleCompatibility: "",
            brandId: undefined,
            model: "",
            year: undefined,
            countryOfOrigin: "",
            description: "",
            dimensionLength: undefined,
            dimensionWidth: undefined,
            dimensionHeight: undefined,
            dimensionUnit: "mm",
            technicalDescription: "",
            weightValue: undefined,
            weightUnit: "kg",
            packingLength: undefined,
            packingWidth: undefined,
            packingHeight: undefined,
            packingDimensionUnit: "cm",
            packingWeight: undefined,
            packingWeightUnit: "kg",
            minOrderQuantity: undefined,
            basePrice: undefined,
            shippingCharge: undefined,
            packingCharge: undefined,
            currency: "AED",
            pricingTerms: [],
            productionLeadTime: undefined,
            readyStockAvailable: true,
            stock: undefined,
            condition: "new",
            pricing_tiers: [],
            individualProductPricing: [],
            manufacturingSource: "In-house",
            manufacturingSourceName: "",
            requiresExportLicense: false,
            hasWarranty: true,
            warranty: "",
            warrantyDuration: undefined,
            warrantyDurationUnit: "months",
            warrantyTerms: "",
            complianceConfirmed: true,
            supplierSignature: "",
            signatureDate: {
                day: new Date().getDate(),
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            },
            isFeatured: false,
            status: "draft",
            actionType: "buy_now",
            gallery: [],
        },
    });

    // ============================================================================
    // WATCHERS & VALIDATION
    // ============================================================================

    const mainCategoryId = form.watch("mainCategoryId");
    const { data: categories = [], isLoading: isLoadingCategories } = useCategoriesByParent(mainCategoryId || undefined);

    const categoryId = form.watch("categoryId");
    const { data: subCategories = [], isLoading: isLoadingSubCategories } = useCategoriesByParent(categoryId || undefined);

    const subCategoryId = form.watch("subCategoryId");

    const isControlledItemVisible = (() => {
        const main = mainCategories.find(c => c.id === mainCategoryId);
        const cat = categories.find(c => c.id === categoryId);
        const sub = subCategories.find(c => c.id === subCategoryId);
        return !!main?.is_controlled || !!main?.isControlled || !!cat?.is_controlled || !!cat?.isControlled || !!sub?.is_controlled || !!sub?.isControlled;
    })();

    const pricingTiers = form.watch("pricing_tiers") || [];
    const gallery = form.watch("gallery") || [];

    // Basic Info Validation for initial save
    const watchName = form.watch("name");
    const watchCategories = form.watch("mainCategoryId");
    const watchDesc = form.watch("description");
    const canSaveBasics = !!(watchName && watchCategories && watchDesc);

    // ============================================================================
    // DATA INITIALIZATION
    // ============================================================================

    useEffect(() => {
        if (productId && product && initializedId.current !== productId) {
            const productData = product as any;
            const getVal = (k1: string, k2: string) => (productData[k1] !== undefined ? productData[k1] : productData[k2]);

            const parseNumber = (val: any) => {
                if (val === undefined || val === null || val === '') return undefined;
                const num = Number(val);
                return isNaN(num) ? undefined : num;
            };

            // Parse gallery
            const parsedGallery = Array.isArray(productData.gallery) ? productData.gallery : [];

            // Parse explicit date or default
            const signatureDateVal = getVal("signatureDate", "submission_date");
            let parsedSigDate = { day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear() };
            if (typeof signatureDateVal === 'string') {
                const parts = signatureDateVal.split('T')[0].split('-');
                if (parts.length === 3) parsedSigDate = { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
            } else if (signatureDateVal && typeof signatureDateVal === 'object') {
                parsedSigDate = signatureDateVal;
            }

            form.reset({
                name: productData.name || "",
                sku: productData.sku || "",
                description: productData.description || "",
                mainCategoryId: parseNumber(getVal("mainCategoryId", "main_category_id")) || (productData.main_category as any)?.id,
                categoryId: parseNumber(getVal("categoryId", "category_id")) || (productData.category as any)?.id,
                subCategoryId: parseNumber(getVal("subCategoryId", "sub_category_id")) || (productData.sub_category as any)?.id,
                certifications: productData.certifications || [],
                controlledItemType: getVal("controlledItemType", "controlled_item_type") || "",
                vehicleCompatibility: getVal("vehicleCompatibility", "vehicle_compatibility") || "",
                countryOfOrigin: getVal("countryOfOrigin", "country_of_origin") || "",
                brandId: parseNumber(getVal("brandId", "brand_id")) || (productData.brand as any)?.id,
                model: productData.model || "",
                year: parseNumber(productData.year),
                condition: getVal("condition", "condition") || "new",

                // Technical
                dimensionLength: parseNumber(getVal("dimensionLength", "dimension_length")),
                dimensionWidth: parseNumber(getVal("dimensionWidth", "dimension_width")),
                dimensionHeight: parseNumber(getVal("dimensionHeight", "dimension_height")),
                dimensionUnit: getVal("dimensionUnit", "dimension_unit") || "mm",
                technicalDescription: getVal("technicalDescription", "technical_description") || "",
                weightValue: parseNumber(getVal("weightValue", "weight_value")),
                weightUnit: getVal("weightUnit", "weight_unit") || "kg",
                packingLength: parseNumber(getVal("packingLength", "packing_length")),
                packingWidth: parseNumber(getVal("packingWidth", "packing_width")),
                packingHeight: parseNumber(getVal("packingHeight", "packing_height")),
                packingDimensionUnit: getVal("packingDimensionUnit", "packing_dimension_unit") || "cm",
                packingWeight: parseNumber(getVal("packingWeight", "packing_weight")),
                packingWeightUnit: getVal("packingWeightUnit", "packing_weight_unit") || "kg",
                minOrderQuantity: parseNumber(getVal("minOrderQuantity", "min_order_quantity")),

                // Pricing
                basePrice: parseNumber(getVal("basePrice", "base_price")) || parseNumber(productData.price) || 0,
                shippingCharge: parseNumber(getVal("shippingCharge", "shipping_charge")),
                packingCharge: parseNumber(getVal("packingCharge", "packing_charge")),
                currency: getVal("currency", "currency") || "AED",
                pricingTerms: getVal("pricingTerms", "pricing_terms") || [],
                productionLeadTime: parseNumber(getVal("productionLeadTime", "production_lead_time")),
                readyStockAvailable: getVal("readyStockAvailable", "ready_stock_available") ?? false,
                stock: parseNumber(productData.stock),
                pricing_tiers: Array.isArray(productData.pricing_tiers) ? productData.pricing_tiers : [],
                individualProductPricing: getVal("individualProductPricing", "individual_product_pricing") || [],

                // Declarations
                manufacturingSource: getVal("manufacturingSource", "manufacturing_source") || "In-house",
                manufacturingSourceName: getVal("manufacturingSourceName", "manufacturing_source_name") || "",
                requiresExportLicense: getVal("requiresExportLicense", "requires_export_license") ?? false,
                hasWarranty: getVal("hasWarranty", "has_warranty") ?? false,
                warranty: productData.warranty || "",
                warrantyDuration: parseNumber(getVal("warrantyDuration", "warranty_duration")),
                warrantyDurationUnit: getVal("warrantyDurationUnit", "warranty_duration_unit") || "months",
                warrantyTerms: getVal("warrantyTerms", "warranty_terms") || "",
                complianceConfirmed: getVal("complianceConfirmed", "compliance_confirmed") ?? false,
                supplierSignature: getVal("supplierSignature", "supplier_signature") || "",
                signatureDate: parsedSigDate,

                status: productData.status || "draft",
                isFeatured: !!productData.isFeatured,
                gallery: parsedGallery,
                image: productData.image || productData.imageUrl || "",

                // Arrays
                // sizes: getVal("sizes", "sizes") || [],
                // thickness: getVal("thickness", "thickness") || [],
                // colors: getVal("colors", "colors") || [],
                // vehicleFitment: getVal("vehicleFitment", "vehicle_fitment") || [],
            });

            initializedId.current = productId;
        }
    }, [productId, product, form]);

    // ============================================================================
    // HELPERS
    // ============================================================================

    const FIELD_MAPPING: Record<string, string> = {
        vehicleFitment: 'vehicle_fitment',
        dimensionLength: 'dimension_length',
        dimensionWidth: 'dimension_width',
        dimensionHeight: 'dimension_height',
        dimensionUnit: 'dimension_unit',
        technicalDescription: 'technical_description',
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
        controlledItemType: 'controlled_item_type',
        countryOfOrigin: 'country_of_origin',
        mainCategoryId: 'main_category_id',
        categoryId: 'category_id',
        subCategoryId: 'sub_category_id',
        basePrice: 'base_price',
        shippingCharge: 'shipping_charge',
        packingCharge: 'packing_charge',
        individualProductPricing: 'individual_product_pricing',
        brandId: 'brand_id'
    };

    const cleanDataForApi = (data: ProductFormValues): Record<string, unknown> => {
        const cleanedData: Record<string, unknown> = {};

        // Only include fields relevant to current section + previously saved fields (via form state)
        // Or simpler: Include ALL fields from form state that are not undefined
        Object.keys(data).forEach(key => {
            const value = data[key as keyof ProductFormValues];
            const apiField = FIELD_MAPPING[key] || key;

            if (key === "signatureDate" && value && typeof value === 'object') {
                const d = value as { day?: number, month?: number, year?: number };
                if (d.day && d.month && d.year) {
                    cleanedData[apiField] = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                }
            } else if (value !== undefined && value !== null && value !== "") {
                cleanedData[apiField] = value;
            } else if (Array.isArray(value)) {
                cleanedData[apiField] = value; // Keep empty arrays
            }
        });

        // Explicitly handle nulls for some fields
        if (!data.productionLeadTime) cleanedData['production_lead_time'] = null;

        return cleanedData;
    };

    const addArrayItem = (field: any) => {
        const current = form.getValues(field) || [];
        form.setValue(field, [...current, ""]);
    };

    const removeArrayItem = (field: any, index: number) => {
        const current = form.getValues(field) || [];
        form.setValue(field, current.filter((_: any, i: number) => i !== index));
    };

    const updateArrayItem = (field: any, index: number, value: string) => {
        const current = form.getValues(field) || [];
        const updated = [...current];
        updated[index] = value;
        form.setValue(field, updated);
    };

    const handleImageUpload = async (file: File, type: 'cover' | 'gallery') => {
        // Mock upload or direct file append for form submission handling
        if (type === 'cover') setCoverImageFile(file);
        else setGalleryFiles(prev => [...prev, file]);
    };

    const generateSku = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        form.setValue('sku', `SKU-${code}`);
    };

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleToggle = (sectionId: string) => {
        if (unlockedSections.has(sectionId)) {
            setOpenSection(prev => prev === sectionId ? "" : sectionId);
            // Update URL without navigation
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("section", sectionId);
            window.history.replaceState(null, "", newUrl.toString());
        }
    };

    const onSaveSection = async () => {
        // Validate current section
        const isValid = await form.trigger(undefined, { shouldFocus: true });
        if (!isValid) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Additional Logic for Specs
        if (openSection === "technical" && localSpecs.length > 0) {
            // Validate specs
            if (localSpecs[0].type !== 'title_only') {
                toast.warning('First specification must be a Title.');
                return;
            }
            await bulkUpdateSpecs.mutateAsync(localSpecs);
        }

        // Prepare data
        const values = form.getValues();
        const cleanedData = cleanDataForApi(values);

        const fd = new FormData();
        Object.keys(cleanedData).forEach(key => {
            const val = cleanedData[key];
            if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
                fd.append(key, JSON.stringify(val));
            } else {
                fd.append(key, String(val));
            }
        });

        // Files
        if (coverImageFile) fd.append('files', coverImageFile);
        galleryFiles.forEach(f => fd.append('files', f));

        try {
            setIsSaving(true);
            let nextSectionId = "";
            const currentIndex = SECTIONS.findIndex(s => s.id === openSection);

            if (!currentProductId) {
                // Create
                const res = await createProductMutation.mutateAsync(fd as unknown as CreateProductRequest);
                const newId = (res as any).id || (res as any).data?.id;
                setCurrentProductId(newId);
                toast.success("Product created! Please complete remaining sections.");

                // Navigate to Edit page
                const basePath = isVendor ? "/vendor/product" : "/admin/product";
                router.push(`${basePath}/${newId}/edit?section=${SECTIONS[1].id}`);
                return; // Router will handle the rest
            } else {
                // Update
                await updateProductMutation.mutateAsync({ id: currentProductId, data: fd as unknown as UpdateProductRequest });
                toast.success("Section saved!");

                if (currentIndex < SECTIONS.length - 1) {
                    nextSectionId = SECTIONS[currentIndex + 1].id;
                    setUnlockedSections(prev => new Set([...Array.from(prev), nextSectionId]));
                    setOpenSection(nextSectionId);
                    // Update URL
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set("section", nextSectionId);
                    window.history.replaceState(null, "", newUrl.toString());
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    if (isLoadingProduct && productId) return <div className="flex h-64 items-center justify-center"><Spinner size="xl" /></div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <Accordion className="space-y-4">
                {/* SECTION 1: BASIC INFO */}
                <AccordionItem
                    id="basic-info"
                    title="Basic Information"
                    icon={Package}
                    isOpen={openSection === "basic-info"}
                    isLocked={!unlockedSections.has("basic-info")}
                    onToggle={() => handleToggle("basic-info")}
                >
                    <div className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name *</FormLabel>
                                <FormControl><Input {...field} placeholder="e.g. Armored Toyota Land Cruiser" onChange={e => {
                                    field.onChange(e);
                                    if (!currentProductId && !form.getValues("sku")) generateSku();
                                }} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid gap-6 md:grid-cols-3">
                            <FormField control={form.control} name="mainCategoryId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Main Category *</FormLabel>
                                    <Select value={field.value?.toString()} onValueChange={v => {
                                        field.onChange(parseInt(v));
                                        form.setValue("categoryId", undefined);
                                        form.setValue("subCategoryId", undefined);
                                    }}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{mainCategories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="categoryId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select value={field.value?.toString()} onValueChange={v => {
                                        field.onChange(parseInt(v));
                                        form.setValue("subCategoryId", undefined);
                                    }} disabled={!mainCategoryId}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="subCategoryId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subcategory</FormLabel>
                                    <Select value={field.value?.toString()} onValueChange={v => field.onChange(parseInt(v))} disabled={!categoryId}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                        <SelectContent>{subCategories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Brand / Model / Year */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <FormField control={form.control} name="brandId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <Select value={field.value?.toString()} onValueChange={v => field.onChange(parseInt(v))}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger></FormControl>
                                        <SelectContent>{brands.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="model" render={({ field }) => (
                                <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="year" render={({ field }) => (
                                <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        {/* Additional Fields: Certificate, Controlled Item, Vehicle Comp, Country */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="md:col-span-1">
                                <Label className="mb-2 block">Certifications / Standards</Label>
                                {(form.watch("certifications") || []).map((item: string, index: number) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <Input value={item} placeholder="e.g., CEN BR6" onChange={e => updateArrayItem("certifications", index, e.target.value)} />
                                        <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem("certifications", index)}><X className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("certifications")}><Plus className="mr-2 h-4 w-4" /> Add Certification</Button>
                            </div>

                            <div className="space-y-4">
                                {isControlledItemVisible && (
                                    <FormField control={form.control} name="controlledItemType" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-destructive font-medium">Controlled Item Type *</FormLabel>
                                            <FormControl><Input placeholder="e.g. ITAR / Dual-Use" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <FormField control={form.control} name="vehicleCompatibility" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Compatibility</FormLabel>
                                        <FormControl><Input placeholder="Toyota Land Cruiser" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="countryOfOrigin" render={({ field }) => {
                                    const [showCountry, setShowCountry] = useState(false);
                                    const countrySearch = field.value || "";
                                    const filtered = COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 10);

                                    return (
                                        <FormItem className="relative">
                                            <FormLabel>Country of Origin</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Search country..."
                                                        value={field.value || ""}
                                                        onChange={e => { field.onChange(e.target.value); setShowCountry(true); }}
                                                        onFocus={() => setShowCountry(true)}
                                                        onBlur={() => setTimeout(() => setShowCountry(false), 200)}
                                                    />
                                                    {showCountry && filtered.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                                                            {filtered.map(c => (
                                                                <div key={c.countryCode} className="px-3 py-2 cursor-pointer hover:bg-accent flex items-center gap-2"
                                                                    onMouseDown={(e) => { e.preventDefault(); field.onChange(c.name); setShowCountry(false); }}>
                                                                    <span>{c.flag}</span><span>{c.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }} />
                            </div>
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl><RichTextEditor value={field.value || ""} onChange={field.onChange} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex justify-end pt-4">
                            <Button onClick={onSaveSection} disabled={isSaving || (!currentProductId && !canSaveBasics)}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save & Continue
                            </Button>
                        </div>
                    </div>
                </AccordionItem>

                {/* SECTION 2: TECHNICAL SPECS */}
                <AccordionItem
                    id="technical"
                    title="Technical Specifications"
                    icon={Settings}
                    isOpen={openSection === "technical"}
                    isLocked={!unlockedSections.has("technical")}
                    onToggle={() => handleToggle("technical")}
                >
                    <div className="space-y-6">
                        {currentProductId ? (
                            <SpecsEditor localSpecs={localSpecs} setLocalSpecs={setLocalSpecs} />
                        ) : <div className="p-4 bg-muted text-center rounded-md">Save Basic Info first to edit specifications.</div>}

                        <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                            <FormField control={form.control} name="dimensionLength" render={({ field }) => (
                                <FormItem><FormLabel>Length</FormLabel><FormControl><Input type="number" placeholder="Length" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="dimensionWidth" render={({ field }) => (
                                <FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" placeholder="Width" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="dimensionHeight" render={({ field }) => (
                                <FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" placeholder="Height" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="technicalDescription" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Additional Technical Details</FormLabel>
                                <FormControl><RichTextEditor value={field.value || ""} onChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />

                        <div className="flex justify-end pt-4">
                            <Button onClick={onSaveSection} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue</Button>
                        </div>
                    </div>
                </AccordionItem>

                {/* SECTION 3: PRICING */}
                <AccordionItem
                    id="pricing"
                    title="Pricing & Availability"
                    icon={ShoppingCart}
                    isOpen={openSection === "pricing"}
                    isLocked={!unlockedSections.has("pricing")}
                    onToggle={() => handleToggle("pricing")}
                >
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="basePrice" render={({ field }) => (
                                <FormItem><FormLabel>Base Price *</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="currency" render={({ field }) => (
                                <FormItem><FormLabel>Currency</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="AED">AED</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage /></FormItem>
                            )} />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="stock" render={({ field }) => (
                                <FormItem><FormLabel>Stock Quantity *</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="productionLeadTime" render={({ field }) => (
                                <FormItem><FormLabel>Lead Time (Days)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        {/* Wholesale Pricing Tiers */}
                        <div className="border p-4 rounded-md space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">Wholesale Pricing Tiers</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    const current = form.getValues("pricing_tiers") || [];
                                    form.setValue("pricing_tiers", [...current, { min_quantity: 0, max_quantity: null, price: 0 }]);
                                }}><Plus className="h-4 w-4 mr-2" /> Add Tier</Button>
                            </div>
                            {form.watch("pricing_tiers")?.map((_, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                    <FormField control={form.control} name={`pricing_tiers.${index}.min_quantity`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormLabel className="text-xs">Min Qty</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name={`pricing_tiers.${index}.price`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormLabel className="text-xs">Price</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                                        const current = form.getValues("pricing_tiers") || [];
                                        form.setValue("pricing_tiers", current.filter((_, i) => i !== index));
                                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>

                        {/* Individual Product Pricing (Combos) */}
                        <div className="border p-4 rounded-md space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">Individual Components (Combo Product)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    const current = form.getValues("individualProductPricing") || [];
                                    form.setValue("individualProductPricing", [...current, { name: "", amount: 0 }]);
                                }}><Plus className="h-4 w-4 mr-2" /> Add Component</Button>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">If this is a bundled product (e.g. 4x Wheels + 4x Tires), list individual component prices here for invoicing.</div>
                            {form.watch("individualProductPricing")?.map((_, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                    <FormField control={form.control} name={`individualProductPricing.${index}.name`} render={({ field }) => (
                                        <FormItem className="flex-[2]"><FormLabel className="text-xs">Component Name</FormLabel><FormControl><Input placeholder="e.g. Front Right Wheel" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name={`individualProductPricing.${index}.amount`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormLabel className="text-xs">Price</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                                        const current = form.getValues("individualProductPricing") || [];
                                        form.setValue("individualProductPricing", current.filter((_, i) => i !== index));
                                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={onSaveSection} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue</Button>
                        </div>
                    </div>
                </AccordionItem>

                {/* SECTION 4: UPLOADS */}
                <AccordionItem
                    id="uploads"
                    title="Uploads & Media"
                    icon={ImageIcon}
                    isOpen={openSection === "uploads"}
                    isLocked={!unlockedSections.has("uploads")}
                    onToggle={() => handleToggle("uploads")}
                >
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base mb-2 block">Cover Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById('cover-upload')?.click()}>
                                {coverImageFile ? (
                                    <img src={URL.createObjectURL(coverImageFile)} className="h-40 object-contain mb-2" />
                                ) : form.getValues("image") ? (
                                    <img src={form.getValues("image") || ""} className="h-40 object-contain mb-2" />
                                ) : (
                                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                                )}
                                <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                                <Input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'cover');
                                }} />
                            </div>
                        </div>

                        <div>
                            <Label className="text-base mb-2 block">Gallery</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Existing Gallery */}
                                {form.watch("gallery")?.map((url, i) => (
                                    <div key={i} className="relative aspect-square border rounded-md overflow-hidden group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                            // Handle delete logic via API usually, locally for now remove from array
                                            // For complex logic refer to original file
                                            removeArrayItem("gallery", i);
                                        }}><X className="h-3 w-3" /></Button>
                                    </div>
                                ))}
                                {/* New Files */}
                                {galleryFiles.map((file, i) => (
                                    <div key={`new-${i}`} className="relative aspect-square border rounded-md overflow-hidden">
                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded">New</div>
                                    </div>
                                ))}
                                {/* Add Button */}
                                <label className="border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 aspect-square">
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                    <Input type="file" className="hidden" multiple accept="image/*" onChange={e => {
                                        if (e.target.files) Array.from(e.target.files).forEach(f => handleImageUpload(f, 'gallery'));
                                    }} />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={onSaveSection} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue</Button>
                        </div>
                    </div>
                </AccordionItem>

                {/* SECTION 5: DECLARATIONS */}
                <AccordionItem
                    id="declarations"
                    title="Declarations"
                    icon={Shield}
                    isOpen={openSection === "declarations"}
                    isLocked={!unlockedSections.has("declarations")}
                    onToggle={() => handleToggle("declarations")}
                >
                    <div className="space-y-6">
                        <FormField control={form.control} name="manufacturingSource" render={({ field }) => (
                            <FormItem><FormLabel>Manufacturing Source</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="In-house">In-house</SelectItem><SelectItem value="Sourced">Sourced</SelectItem></SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="supplierSignature" render={({ field }) => (
                                <FormItem><FormLabel>Digital Signature *</FormLabel><FormControl><Input {...field} placeholder="Type full name" /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="signatureDate" render={({ field }) => (
                                <FormItem><FormLabel>Date</FormLabel><DateSelector value={field.value} onChange={field.onChange} /></FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem className="p-4 bg-muted/30 rounded-lg border">
                                <FormLabel className="text-base">Publish Status</FormLabel>
                                <FormControl>
                                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 mt-2">
                                        <RadioGroupItem value="draft" id="draft" label="Draft" />
                                        <RadioGroupItem value="published" id="published" label="Published" />
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )} />

                        <div className="flex justify-end pt-4 gap-4">
                            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button onClick={onSaveSection} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finish & Save</Button>
                        </div>
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    );
}


// Subcomponent for Specs Table (Simplified for brevity but mirroring logic)
function SpecsEditor({ localSpecs, setLocalSpecs }: { localSpecs: ProductSpecification[], setLocalSpecs: any }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showPaste, setShowPaste] = useState(false);

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const clipboardData = e.clipboardData.getData('text');
        processPasteData(clipboardData);
    };

    const processPasteData = (data: string) => {
        const rows = data.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
        const newSpecs: ProductSpecification[] = [];
        let currentSort = localSpecs.length > 0 ? Math.max(...localSpecs.map(s => s.sort)) + 1 : 0;

        rows.forEach((row, index) => {
            const cols = row.split(/\t|,/).map(col => col.trim()); // Split by tab or comma

            if (cols.length === 1 && cols[0]) {
                // Likely a title
                newSpecs.push({
                    label: cols[0],
                    value: '',
                    type: 'title_only',
                    active: false,
                    sort: currentSort++
                });
            } else if (cols.length >= 2) {
                newSpecs.push({
                    label: cols[0],
                    value: cols[1] || '',
                    type: 'general',
                    active: false,
                    sort: currentSort++
                });
            }
        });

        if (newSpecs.length > 0) {
            setLocalSpecs((prev: any) => [...prev, ...newSpecs]);
            toast.success(`Imported ${newSpecs.length} specifications`);
            setShowPaste(false);
        }
    };

    return (
        <div className="border rounded-md p-4 bg-background">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> Specifications</h3>
                <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowPaste(!showPaste)}>
                        {showPaste ? 'Cancel Paste' : 'Bulk Paste from Excel'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setLocalSpecs([...localSpecs, { label: '', value: '', type: 'general', active: false, sort: localSpecs.length }])}>
                        <Plus className="h-4 w-4 mr-2" /> Add Row
                    </Button>
                </div>
            </div>

            {showPaste && (
                <div className="mb-4 p-4 border border-dashed rounded-md bg-muted/50">
                    <Label className="mb-2 block">Paste data from Excel or CSV here:</Label>
                    <textarea
                        ref={textareaRef}
                        className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-background"
                        placeholder={`Paste format:\nLabel\tValue\nTitle Row\nLabel\tValue`}
                        onPaste={handlePaste}
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                        * Tips: Single column = Section Title. Two columns = Label & Value.
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {localSpecs.length === 0 && !showPaste && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                        No specifications added. Add a row or paste from Excel.
                    </div>
                )}
                {localSpecs.map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center group">
                        <div className="cursor-move text-muted-foreground px-1"><Hash className="h-3 w-3" /></div>
                        <Select value={spec.type} onValueChange={(v: "title_only" | "general" | "value_only") => {
                            const newSpecs = [...localSpecs];
                            newSpecs[i].type = v;
                            // Clear irrelevant fields based on type
                            if (v === 'title_only') newSpecs[i].value = '';
                            if (v === 'value_only') newSpecs[i].label = '';
                            setLocalSpecs(newSpecs);
                        }}>
                            <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="title_only">Section Title</SelectItem>
                                <SelectItem value="general">Label : Value</SelectItem>
                                <SelectItem value="value_only">Value Only</SelectItem>
                            </SelectContent>
                        </Select>

                        {spec.type !== 'value_only' && (
                            <Input
                                value={spec.label || ''}
                                placeholder={spec.type === 'title_only' ? "Section Title (e.g. Dimensions)" : "Label (e.g. Length)"}
                                onChange={e => {
                                    const newSpecs = [...localSpecs];
                                    newSpecs[i].label = e.target.value;
                                    setLocalSpecs(newSpecs);
                                }}
                                className={spec.type === 'title_only' ? 'font-bold flex-1 h-9' : 'h-9 w-1/3'}
                            />
                        )}

                        {spec.type !== 'title_only' && (
                            <Input
                                value={spec.value || ''}
                                placeholder="Value (e.g. 500mm)"
                                onChange={e => {
                                    const newSpecs = [...localSpecs];
                                    newSpecs[i].value = e.target.value;
                                    setLocalSpecs(newSpecs);
                                }}
                                className="flex-1 h-9"
                            />
                        )}

                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setLocalSpecs(localSpecs.filter((_, idx) => idx !== i))}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
