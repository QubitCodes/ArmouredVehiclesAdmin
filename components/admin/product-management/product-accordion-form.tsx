"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Package,
    Settings,
    ShoppingCart,
    Image as ImageIcon,
    Shield,
    Loader2,
    Save,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Plus,
    Trash2,
    Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import { MultiSelect } from "@/components/ui/multi-select";
import RichTextEditor from "@/components/ui/rich-text-editor";

// Existing hooks and services
import {
    useCreateProduct,
    useUpdateProduct,
} from "@/hooks/admin/product-management/use-products";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import {
    useMainCategories,
    useCategoriesByParent,
} from "@/hooks/admin/product-management/use-categories";
import { useBrands } from "@/hooks/admin/use-references";

// --- Schemas ---

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
});

const specificationsSchema = z.object({
    dimensionLength: z.number().optional(),
    dimensionWidth: z.number().optional(),
    dimensionHeight: z.number().optional(),
    dimensionUnit: z.string().optional().default("mm"),
    materials: z.array(z.string()).optional().default([]),
    features: z.array(z.string()).optional().default([]),
    performance: z.array(z.string()).optional().default([]),
    technicalDescription: z.string().optional(),
    driveTypes: z.array(z.string()).optional().default([]),
    sizes: z.array(z.string()).optional().default([]),
    thickness: z.array(z.string()).optional().default([]),
    colors: z.array(z.string()).optional().default([]),
    weightValue: z.number().optional(),
    weightUnit: z.string().optional().default("kg"),
    packingLength: z.number().optional(),
    packingWidth: z.number().optional(),
    packingHeight: z.number().optional(),
    packingDimensionUnit: z.string().optional().default("cm"),
    packingWeight: z.number().optional(),
    packingWeightUnit: z.string().optional().default("kg"),
    minOrderQuantity: z.number().optional(),
});

const pricingSchema = z.object({
    basePrice: z.coerce.number().min(0, "Base price must be >= 0").optional().default(0),
    currency: z.string().optional().default("AED"),
    productionLeadTime: z.coerce.number().optional().nullable(),
    stock: z.coerce.number().optional(),
    readyStockAvailable: z.boolean().optional().default(true),
    pricingTerms: z.array(z.string()).optional().default([]),
    pricing_tiers: z.array(pricingTierSchema).optional().default([]),
    individualProductPricing: z.array(z.object({ name: z.string(), amount: z.coerce.number() })).optional().default([]),
});

const mediaSchema = z.object({
    image: z.string().optional(),
    gallery: z.array(z.string()).optional().default([]),
});

const declarationsSchema = z.object({
    manufacturingSource: z.string().optional().default("In-house"),
    manufacturingSourceName: z.string().optional(),
    requiresExportLicense: z.boolean().optional().default(false),
    hasWarranty: z.boolean().optional().default(true),
    warrantyDuration: z.coerce.number().optional(),
    warrantyDurationUnit: z.string().optional().default("months"),
    warrantyTerms: z.string().optional(),
    complianceConfirmed: z.boolean().refine(val => val === true, "Must confirm compliance"),
    supplierSignature: z.string().optional(),
});

const fullProductSchema = basicInfoSchema
    .merge(specificationsSchema)
    .merge(pricingSchema)
    .merge(mediaSchema)
    .merge(declarationsSchema);

export type ProductAccordionFormValues = z.infer<typeof fullProductSchema>;

const SECTIONS = [
    { id: "basic-info", title: "Basic Information", icon: Package, schema: basicInfoSchema },
    { id: "technical", title: "Technical Specs & Variants", icon: Settings, schema: specificationsSchema },
    { id: "pricing", title: "Pricing & Availability", icon: ShoppingCart, schema: pricingSchema },
    { id: "media", title: "Uploads & Media", icon: ImageIcon, schema: mediaSchema },
    { id: "declarations", title: "Final Declarations", icon: Shield, schema: declarationsSchema },
];

export default function ProductAccordionForm({ productId: initialProductId, isNew = false }: { productId?: string; isNew?: boolean }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const domain = (params?.domain as string) || "admin";
    const [currentProductId, setCurrentProductId] = useState<string | null>(initialProductId || null);

    const { data: product, isLoading: isLoadingProduct } = useProduct(currentProductId || "");
    const { mutateAsync: createProduct } = useCreateProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct();

    const [openSection, setOpenSection] = useState<string>(() => searchParams.get("section") || SECTIONS[0].id);
    const [unlockedSections, setUnlockedSections] = useState<Set<string>>(new Set([SECTIONS[0].id]));
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { data: mainCategories = [] } = useMainCategories();
    const { data: brands = [] } = useBrands();

    const openSectionRef = useRef(openSection);
    useEffect(() => { openSectionRef.current = openSection; }, [openSection]);

    const form = useForm<ProductAccordionFormValues>({
        resolver: (async (data, context, options) => {
            const section = SECTIONS.find(s => s.id === openSectionRef.current);
            const schema = section ? section.schema : fullProductSchema;
            const resolverFunc = zodResolver(schema);
            return (resolverFunc as any)(data, context, options);
        }) as Resolver<ProductAccordionFormValues>,
        defaultValues: {
            name: "",
            currency: "AED",
            readyStockAvailable: true,
            manufacturingSource: "In-house",
            requiresExportLicense: false,
            hasWarranty: true,
            complianceConfirmed: false,
        }
    });

    const { fields: pricingTiers, append: appendPricingTier, remove: removePricingTier } = useFieldArray({ control: form.control, name: "pricing_tiers" });
    const { fields: individualPricing, append: appendIndividualProduct, remove: removeIndividualProduct } = useFieldArray({ control: form.control, name: "individualProductPricing" });

    const mainCategoryId = form.watch("mainCategoryId");
    const categoryId = form.watch("categoryId");
    const { data: categories = [] } = useCategoriesByParent(mainCategoryId);
    const { data: subCategories = [] } = useCategoriesByParent(categoryId);

    useEffect(() => {
        if (currentProductId && product && isInitializing) {
            const productData = product;
            const getVal = (k1: string, k2: string) => ((productData as any)[k1] !== undefined ? (productData as any)[k1] : (productData as any)[k2]);
            const parseNumber = (val: any) => {
                if (val === undefined || val === null || val === '') return undefined;
                const num = Number(val);
                return isNaN(num) ? undefined : num;
            };

            form.reset({
                name: productData.name || "",
                sku: productData.sku || "",
                mainCategoryId: productData.mainCategoryId || productData.main_category_id,
                categoryId: productData.categoryId || productData.category_id,
                subCategoryId: productData.subCategoryId || productData.sub_category_id,
                description: productData.description || "",
                dimensionLength: parseNumber(getVal("dimensionLength", "dimension_length")),
                dimensionWidth: parseNumber(getVal("dimensionWidth", "dimension_width")),
                dimensionHeight: parseNumber(getVal("dimensionHeight", "dimension_height")),
                basePrice: parseNumber(getVal("basePrice", "base_price")) || 0,
                currency: getVal("currency", "currency") || "AED",
                readyStockAvailable: getVal("readyStockAvailable", "ready_stock_available") ?? true,
                stock: parseNumber(productData.stock),
                pricing_tiers: productData.pricing_tiers || [],
                image: productData.image || productData.imageUrl || "",
                gallery: productData.gallery || [],
                complianceConfirmed: true,
            });
            setUnlockedSections(new Set(SECTIONS.map(s => s.id)));
            setIsInitializing(false);
        } else if (isNew) {
            setIsInitializing(false);
        }
    }, [currentProductId, product, isInitializing, isNew, form]);

    const onSaveSection = async () => {
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please fill in all required fields in this section.");
            return;
        }

        const data = form.getValues();
        const currentSlug = openSection;

        try {
            setIsSaving(true);
            if (currentSlug === SECTIONS[0].id && !currentProductId) {
                const res = await createProduct(data);
                const newId = res.id;
                toast.success("Basic Info saved!");
                setCurrentProductId(newId);
                router.push(`/${domain}/product/${newId}/edit?section=${SECTIONS[1].id}`);
                setUnlockedSections(prev => new Set([...Array.from(prev), SECTIONS[1].id]));
                setOpenSection(SECTIONS[1].id);
            } else if (currentProductId) {
                await updateProduct({ id: currentProductId, data });
                toast.success("Section updated!");
                const currentIndex = SECTIONS.findIndex(s => s.id === currentSlug);
                if (currentIndex < SECTIONS.length - 1) {
                    const nextId = SECTIONS[currentIndex + 1].id;
                    const newUnlocked = new Set(Array.from(unlockedSections));
                    newUnlocked.add(nextId);
                    setUnlockedSections(newUnlocked);
                    setOpenSection(nextId);
                    const url = new URL(window.location.href);
                    url.searchParams.set("section", nextId);
                    window.history.replaceState(null, "", url.toString());
                } else {
                    router.push(`/${domain}/product/${currentProductId}`);
                }
            }
        } catch (error: any) {
            toast.error("Failed to save. Please check your network.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = (id: string) => {
        if (unlockedSections.has(id)) setOpenSection(openSection === id ? "" : id);
        else toast.error("Complete previous steps first.");
    };

    if (isLoadingProduct && currentProductId) return <div className="flex justify-center items-center h-64"><Spinner size="xl" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{currentProductId ? "Edit Product" : "New Product"}</h1>
                        <p className="text-muted-foreground text-sm">Save each section to progress. Errors stay within the active step.</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <Accordion className="space-y-6">
                    <AccordionItem id={SECTIONS[0].id} title={SECTIONS[0].title} icon={SECTIONS[0].icon} isOpen={openSection === SECTIONS[0].id} onToggle={() => handleToggle(SECTIONS[0].id)}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="mainCategoryId" render={({ field }) => (<FormItem><FormLabel>Main Category</FormLabel>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))}>
                                    <option value="">Select</option>
                                    {mainCategories.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                                <FormMessage />
                            </FormItem>)} />
                            <div className="col-span-2"><FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><RichTextEditor value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></div>
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    <AccordionItem id={SECTIONS[1].id} title={SECTIONS[1].title} isLocked={!unlockedSections.has(SECTIONS[1].id)} isOpen={openSection === SECTIONS[1].id} onToggle={() => handleToggle(SECTIONS[1].id)} icon={SECTIONS[1].icon}>
                        <div className="grid gap-6 md:grid-cols-3">
                            <FormField control={form.control} name="dimensionLength" render={({ field }) => (<FormItem><FormLabel>Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dimensionWidth" render={({ field }) => (<FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="dimensionHeight" render={({ field }) => (<FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="col-span-3 mt-6"><FormField control={form.control} name="technicalDescription" render={({ field }) => (<FormItem><FormLabel>Technical Specs</FormLabel><FormControl><RichTextEditor value={field.value || ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    <AccordionItem id={SECTIONS[2].id} title={SECTIONS[2].title} icon={SECTIONS[2].icon} isLocked={!unlockedSections.has(SECTIONS[2].id)} isOpen={openSection === SECTIONS[2].id} onToggle={() => handleToggle(SECTIONS[2].id)}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="basePrice" render={({ field }) => (<FormItem><FormLabel>Base Price *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3" {...field}><option value="AED">AED</option><option value="USD">USD</option></select>
                            </FormItem>)} />
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-semibold">Wholesale Tiers</h3><Button type="button" variant="outline" size="sm" onClick={() => appendPricingTier({ min_quantity: 0, max_quantity: null, price: 0 })}><Plus className="h-4 w-4 mr-2" />Add</Button></div>
                            {pricingTiers.map((tier, index) => (
                                <div key={tier.id} className="flex gap-4 items-end bg-muted/20 p-4 rounded-md">
                                    <FormField control={form.control} name={`pricing_tiers.${index}.min_quantity`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Min</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name={`pricing_tiers.${index}.max_quantity`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Max</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="∞" /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name={`pricing_tiers.${index}.price`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removePricingTier(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    <AccordionItem id={SECTIONS[3].id} title={SECTIONS[3].title} icon={SECTIONS[3].icon} isLocked={!unlockedSections.has(SECTIONS[3].id)} isOpen={openSection === SECTIONS[3].id} onToggle={() => handleToggle(SECTIONS[3].id)}>
                        <div className="space-y-6">
                            <FormField control={form.control} name="image" render={({ field }) => (<FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <p className="text-xs text-muted-foreground">Detailed gallery management is available on the product detail page once setup is finished.</p>
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    <AccordionItem id={SECTIONS[4].id} title={SECTIONS[4].title} icon={SECTIONS[4].icon} isLocked={!unlockedSections.has(SECTIONS[4].id)} isOpen={openSection === SECTIONS[4].id} onToggle={() => handleToggle(SECTIONS[4].id)}>
                        <div className="space-y-6">
                            <FormField control={form.control} name="complianceConfirmed" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-lg bg-muted/10">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <Label className="leading-none">I confirm all information is accurate and compliant.</Label>
                                    <FormMessage />
                                </FormItem>)} />
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving} variant="default" className="bg-primary text-white">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Complete Setup</Button></div>
                    </AccordionItem>
                </Accordion>
            </Form>
        </div>
    );
}
