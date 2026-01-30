"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Loader2, Trash2, Package, Settings, Save, ShoppingCart, Image as ImageIcon, Shield, UploadCloud, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import RichTextEditor from "@/components/ui/rich-text-editor";

import { useCreateProduct, useUpdateProduct } from "@/hooks/admin/product-management/use-products";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import { useMainCategories, useCategoriesByParent } from "@/hooks/admin/product-management/use-categories";
import { useProductSpecifications, useBulkUpdateSpecifications, useDeleteSpecification } from "@/hooks/admin/product-management/use-product-specifications";

import type { ProductSpecification } from "@/services/admin/product-specification.service";
import type { CreateProductRequest, UpdateProductRequest, Product } from "@/services/admin/product.service";

// Schemas
const pricingTierSchema = z.object({
    min_quantity: z.coerce.number().int().nonnegative().optional(),
    max_quantity: z.union([z.coerce.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
    price: z.coerce.number().nonnegative().optional(),
});

const productSchema = z.object({
    name: z.string().min(1, "Required"), sku: z.string().optional(),
    mainCategoryId: z.number().optional(), categoryId: z.number().optional(), subCategoryId: z.number().optional(),
    certifications: z.array(z.string()).optional(),
    description: z.string().optional(), technicalDescription: z.string().optional(),
    basePrice: z.coerce.number().min(0).optional(), currency: z.string().optional(),
    stock: z.number().optional(), productionLeadTime: z.coerce.number().optional().nullable(),
    readyStockAvailable: z.boolean().optional(),
    pricingTerms: z.array(z.string()).optional(), pricing_tiers: z.array(pricingTierSchema).optional(),
    image: z.string().optional(), gallery: z.array(z.string()).optional(),
    manufacturingSource: z.string().optional(), hasWarranty: z.boolean().optional(),
    complianceConfirmed: z.boolean().optional(), status: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

const SECTIONS = [
    { id: "basic-info", title: "Basic Information", icon: Package },
    { id: "technical", title: "Technical Specifications", icon: Settings },
    { id: "pricing", title: "Pricing & Availability", icon: ShoppingCart },
    { id: "uploads", title: "Uploads & Media", icon: ImageIcon },
    { id: "declarations", title: "Declarations", icon: Shield },
];

interface ProductAccordionFormProps { productId?: string; isVendor?: boolean; }

export default function ProductAccordionForm({ productId, isVendor = false }: ProductAccordionFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const domain = (params?.domain as string) || "admin";

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
    const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);
    const [rowsToAdd, setRowsToAdd] = useState<number>(1);
    const initializedId = useRef<string | null>(null);

    const { data: product, isLoading: isLoadingProduct } = useProduct(currentProductId || "");
    const { data: mainCategories = [] } = useMainCategories();
    const { data: specificationsData = [] } = useProductSpecifications(currentProductId);

    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const bulkUpdateSpecs = useBulkUpdateSpecifications(currentProductId);
    const deleteSpec = useDeleteSpecification(currentProductId);

    useEffect(() => {
        if (specificationsData.length > 0) setLocalSpecs(specificationsData);
        else if (currentProductId && localSpecs.length === 0) setLocalSpecs([{ label: '', value: '', type: 'title_only', active: false, sort: 0 }]);
    }, [specificationsData, currentProductId]);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        shouldUnregister: false,
        mode: "onChange",
        defaultValues: {
            name: "", sku: "", mainCategoryId: undefined, categoryId: undefined, subCategoryId: undefined,
            certifications: [], description: "", technicalDescription: "",
            basePrice: undefined, currency: "AED", stock: undefined, productionLeadTime: undefined,
            readyStockAvailable: true, pricingTerms: [], pricing_tiers: [],
            image: "", gallery: [],
            manufacturingSource: "In-house", hasWarranty: true, complianceConfirmed: true, status: "draft",
        },
    });

    const mainCategoryId = form.watch("mainCategoryId");
    const { data: categories = [] } = useCategoriesByParent(mainCategoryId || undefined);
    const categoryId = form.watch("categoryId");
    const { data: subCategories = [] } = useCategoriesByParent(categoryId || undefined);

    const watchName = form.watch("name");
    const watchCategories = form.watch("mainCategoryId");
    const watchPrice = form.watch("basePrice");
    const watchStock = form.watch("stock");
    const watchDesc = form.watch("description");
    const gallery = form.watch("gallery") || [];

    const canPublish = !!(watchName && watchCategories && (watchPrice !== undefined && watchPrice >= 0) && (watchStock !== undefined && watchStock >= 0) && watchDesc);

    const generateSku = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return `SKU-${code}`;
    };

    const handleNameKeyUp = () => {
        if (!currentProductId && !form.getValues("sku")) form.setValue("sku", generateSku());
    };

    const addArrayItem = (fieldName: "certifications" | "pricingTerms" | "gallery") => {
        const current = form.getValues(fieldName) || [];
        form.setValue(fieldName, [...current, ""]);
    };

    const removeArrayItem = (fieldName: any, index: number) => {
        const current = form.getValues(fieldName) || [];
        form.setValue(fieldName, current.filter((_: any, i: number) => i !== index));
    };

    const updateArrayItem = (fieldName: any, index: number, value: string) => {
        const current = form.getValues(fieldName) || [];
        const updated = [...current];
        updated[index] = value;
        form.setValue(fieldName, updated);
    };

    const addSpecRows = () => {
        const newSpecs = [...localSpecs];
        for (let i = 0; i < rowsToAdd; i++) newSpecs.push({ label: '', value: '', type: 'general', active: false, sort: newSpecs.length });
        setLocalSpecs(newSpecs);
    };

    const updateLocalSpec = (index: number, field: string, val: any) => {
        const updated = [...localSpecs];
        (updated[index] as any)[field] = val;
        setLocalSpecs(updated);
    };

    const deleteSpecRow = async (index: number) => {
        const spec = localSpecs[index];
        if (spec.id) await deleteSpec.mutateAsync(spec.id);
        setLocalSpecs(localSpecs.filter((_, i) => i !== index));
    };

    const FIELD_MAPPING: Record<string, string> = {
        mainCategoryId: 'main_category_id', categoryId: 'category_id', subCategoryId: 'sub_category_id',
        basePrice: 'base_price', productionLeadTime: 'production_lead_time', readyStockAvailable: 'ready_stock_available',
        technicalDescription: 'technical_description', manufacturingSource: 'manufacturing_source',
        hasWarranty: 'has_warranty', complianceConfirmed: 'compliance_confirmed', pricingTerms: 'pricing_terms',
    };

    const cleanDataForApi = (data: ProductFormValues): Record<string, unknown> => {
        const cleanedData: Record<string, unknown> = {};
        Object.keys(data).forEach((field) => {
            const value = data[field as keyof ProductFormValues];
            const apiField = FIELD_MAPPING[field] || field;
            if (Array.isArray(value)) {
                const filtered = value.filter((item) => item !== "");
                if (filtered.length > 0) cleanedData[apiField] = filtered;
            } else if (value !== "" && value !== undefined && value !== null) {
                cleanedData[apiField] = value;
            }
        });
        return cleanedData;
    };

    useEffect(() => {
        if (productId && product && initializedId.current !== productId) {
            const p = product as any;
            form.reset({
                name: p.name || "", sku: p.sku || "",
                basePrice: Number(p.basePrice || p.base_price) || 0,
                currency: p.currency || "AED",
                description: p.description || "",
                mainCategoryId: p.mainCategoryId || p.main_category_id || p.main_category?.id,
                categoryId: p.categoryId || p.category_id || p.category?.id,
                subCategoryId: p.subCategoryId || p.sub_category_id || p.sub_category?.id,
                certifications: Array.isArray(p.certifications) ? p.certifications : [],
                stock: p.stock, status: p.status || "draft",
                image: p.image || p.imageUrl || "",
                gallery: Array.isArray(p.gallery) ? p.gallery : [],
                pricing_tiers: Array.isArray(p.pricing_tiers) ? p.pricing_tiers : [],
            } as any);
            initializedId.current = productId;
        }
    }, [productId, product, form]);

    const handleToggle = (sectionId: string) => {
        if (unlockedSections.has(sectionId)) setOpenSection(openSection === sectionId ? "" : sectionId);
    };

    const onSaveSection = async () => {
        const data = form.getValues();
        try {
            setIsSaving(true);
            if (currentProductId && openSection === "technical") await bulkUpdateSpecs.mutateAsync(localSpecs);

            const cleanedData = cleanDataForApi(data);
            const fd = new FormData();
            Object.keys(cleanedData).forEach(key => {
                const value = cleanedData[key];
                if (value === undefined || value === null) return;
                if (Array.isArray(value) || typeof value === 'object') fd.append(key, JSON.stringify(value));
                else fd.append(key, String(value));
            });
            if (coverImageFile) fd.append('files', coverImageFile);
            galleryFiles.forEach(file => fd.append('files', file));

            if (openSection === SECTIONS[0].id && !currentProductId) {
                const res = await createProductMutation.mutateAsync(fd as unknown as CreateProductRequest);
                const newId = (res as Product).id;
                toast.success("Product created!");
                setCurrentProductId(newId);
                setCoverImageFile(null); setGalleryFiles([]);
                setUnlockedSections(prev => new Set([...prev, SECTIONS[1].id]));
                setOpenSection(SECTIONS[1].id);
                router.push(`/${domain}/product/${newId}/edit?section=${SECTIONS[1].id}`);
            } else if (currentProductId) {
                await updateProductMutation.mutateAsync({ id: currentProductId, data: fd as unknown as UpdateProductRequest });
                toast.success("Section saved!");
                setCoverImageFile(null); setGalleryFiles([]);
                const idx = SECTIONS.findIndex(s => s.id === openSection);
                if (idx < SECTIONS.length - 1) {
                    setUnlockedSections(prev => new Set([...prev, SECTIONS[idx + 1].id]));
                    setOpenSection(SECTIONS[idx + 1].id);
                }
            }
        } catch (e: any) { toast.error(e?.response?.data?.message || "Operation failed"); }
        finally { setIsSaving(false); }
    };

    if (productId && isLoadingProduct) return <div className="flex min-h-[400px] items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{currentProductId ? "Edit Product" : "Add New Product"}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Complete each section</p>
                    </div>
                </div>
                {currentProductId && <Button variant="outline" onClick={() => window.open(`/product/${currentProductId}`, '_blank')}><Eye className="h-4 w-4 mr-2" />Preview</Button>}
            </div>

            <Form {...form}>
                <Accordion className="space-y-4">
                    {/* BASIC INFO */}
                    <AccordionItem id={SECTIONS[0].id} title={SECTIONS[0].title} icon={SECTIONS[0].icon} isOpen={openSection === SECTIONS[0].id} onToggle={() => handleToggle(SECTIONS[0].id)} isLocked={!unlockedSections.has(SECTIONS[0].id)}>
                        <div className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name *</FormLabel><FormControl><Input placeholder="Product name" {...field} onKeyUp={handleNameKeyUp} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} readOnly className="bg-muted" /></FormControl></FormItem>)} />
                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField control={form.control} name="mainCategoryId" render={({ field }) => (<FormItem><FormLabel>Main Category</FormLabel><FormControl><Select value={field.value?.toString() || ""} onChange={(e) => { field.onChange(e.target.value ? parseInt(e.target.value) : undefined); form.setValue("categoryId", undefined); form.setValue("subCategoryId", undefined); }}>{mainCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormControl></FormItem>)} />
                                <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Select value={field.value?.toString() || ""} onChange={(e) => { field.onChange(e.target.value ? parseInt(e.target.value) : undefined); form.setValue("subCategoryId", undefined); }} disabled={!mainCategoryId}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormControl></FormItem>)} />
                                <FormField control={form.control} name="subCategoryId" render={({ field }) => (<FormItem><FormLabel>Subcategory</FormLabel><FormControl><Select value={field.value?.toString() || ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} disabled={!categoryId}>{subCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormControl></FormItem>)} />
                            </div>
                            <div><Label className="mb-2 block">Certifications</Label>
                                {(form.watch("certifications") || []).map((item: string, i: number) => (<div key={i} className="flex gap-2 mb-2"><Input value={item} onChange={e => updateArrayItem("certifications", i, e.target.value)} /><Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem("certifications", i)}><X className="h-4 w-4" /></Button></div>))}
                                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("certifications")}><Plus className="mr-2 h-4 w-4" />Add</Button>
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><RichTextEditor value={field.value || ""} onChange={field.onChange} /></FormControl></FormItem>)} />
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    {/* TECHNICAL */}
                    <AccordionItem id={SECTIONS[1].id} title={SECTIONS[1].title} icon={SECTIONS[1].icon} isOpen={openSection === SECTIONS[1].id} onToggle={() => handleToggle(SECTIONS[1].id)} isLocked={!unlockedSections.has(SECTIONS[1].id)}>
                        {currentProductId && (<div className="space-y-4">
                            <div className="border rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="px-2 py-2">Label</th><th className="px-2 py-2">Value</th><th className="w-20 px-2 py-2">Actions</th></tr></thead><tbody>{localSpecs.map((spec, i) => (<tr key={spec.id || `new-${i}`} className="border-t"><td className="px-2 py-2"><Input value={spec.label || ''} onChange={(e) => updateLocalSpec(i, 'label', e.target.value)} /></td><td className="px-2 py-2"><Input value={spec.value || ''} onChange={(e) => updateLocalSpec(i, 'value', e.target.value)} /></td><td className="px-2 py-2"><Button type="button" variant="outline" size="icon" onClick={() => deleteSpecRow(i)}><Trash2 className="h-4 w-4" /></Button></td></tr>))}</tbody></table></div>
                            <div className="flex gap-2"><Input type="number" min="1" value={rowsToAdd} onChange={(e) => setRowsToAdd(parseInt(e.target.value) || 1)} className="w-16" /><Button type="button" variant="outline" size="sm" onClick={addSpecRows}><Plus className="mr-2 h-4 w-4" />Add Rows</Button></div>
                        </div>)}
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    {/* PRICING */}
                    <AccordionItem id={SECTIONS[2].id} title={SECTIONS[2].title} icon={SECTIONS[2].icon} isOpen={openSection === SECTIONS[2].id} onToggle={() => handleToggle(SECTIONS[2].id)} isLocked={!unlockedSections.has(SECTIONS[2].id)}>
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField control={form.control} name="basePrice" render={({ field }) => (<FormItem><FormLabel>Base Price *</FormLabel><FormControl><Input type="number" step="0.01" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel><FormControl><Select value={field.value || "AED"} onChange={field.onChange}><option value="AED">AED</option><option value="USD">USD</option></Select></FormControl></FormItem>)} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock *</FormLabel><FormControl><Input type="number" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="productionLeadTime" render={({ field }) => (<FormItem><FormLabel>Lead Time (Days)</FormLabel><FormControl><Input type="number" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="readyStockAvailable" render={({ field }) => (<FormItem><FormLabel>Ready Stock?</FormLabel><FormControl><RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")} className="flex gap-4"><RadioGroupItem value="yes" label="Yes" /><RadioGroupItem value="no" label="No" /></RadioGroup></FormControl></FormItem>)} />
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    {/* UPLOADS */}
                    <AccordionItem id={SECTIONS[3].id} title={SECTIONS[3].title} icon={SECTIONS[3].icon} isOpen={openSection === SECTIONS[3].id} onToggle={() => handleToggle(SECTIONS[3].id)} isLocked={!unlockedSections.has(SECTIONS[3].id)}>
                        <div className="space-y-6">
                            <FormField control={form.control} name="image" render={() => (<FormItem><FormLabel>Cover Image</FormLabel><FormControl>
                                <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50">
                                    {coverImageFile ? <img src={URL.createObjectURL(coverImageFile)} className="max-h-48 object-contain" alt="Cover" /> : form.watch('image') ? <img src={form.watch('image') as string} className="max-h-48 object-contain" alt="Cover" /> : <><UploadCloud className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Click to upload</span></>}
                                    <Input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setCoverImageFile(e.target.files[0]); }} />
                                </label>
                            </FormControl></FormItem>)} />
                            <div><Label className="mb-2 block">Gallery ({gallery.length + galleryFiles.length})</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {gallery.map((item, i) => (<div key={`existing-${i}`} className="relative aspect-square border rounded-lg overflow-hidden"><img src={item} className="w-full h-full object-cover" alt={`Gallery ${i}`} /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeArrayItem('gallery', i)}><X className="h-3 w-3" /></Button></div>))}
                                    {galleryFiles.map((file, i) => (<div key={`new-${i}`} className="relative aspect-square border-2 border-primary rounded-lg overflow-hidden"><img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={file.name} /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setGalleryFiles(galleryFiles.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button></div>))}
                                    <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary/50"><Plus className="w-6 h-6 text-muted-foreground" /><span className="text-xs text-muted-foreground">Add</span><Input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])]); }} /></label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save & Continue</Button></div>
                    </AccordionItem>

                    {/* DECLARATIONS */}
                    <AccordionItem id={SECTIONS[4].id} title={SECTIONS[4].title} icon={SECTIONS[4].icon} isOpen={openSection === SECTIONS[4].id} onToggle={() => handleToggle(SECTIONS[4].id)} isLocked={!unlockedSections.has(SECTIONS[4].id)}>
                        <div className="space-y-6">
                            <FormField control={form.control} name="manufacturingSource" render={({ field }) => (<FormItem><FormLabel>Manufacturing Source</FormLabel><FormControl><Select value={field.value || ""} onChange={field.onChange}><option value="">Select</option><option value="In-House">In-House</option><option value="Sourced">Sourced</option></Select></FormControl></FormItem>)} />
                            <FormField control={form.control} name="hasWarranty" render={({ field }) => (<FormItem><FormLabel>Has Warranty?</FormLabel><FormControl><RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")} className="flex gap-4"><RadioGroupItem value="yes" label="Yes" /><RadioGroupItem value="no" label="No" /></RadioGroup></FormControl></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem className="p-4 border rounded-md bg-muted/20"><FormLabel className="text-base font-semibold">Publish Status</FormLabel><FormControl><RadioGroup value={field.value || "draft"} onValueChange={field.onChange} className="flex flex-col space-y-1"><RadioGroupItem value="draft" label="Draft (Hidden)" /><RadioGroupItem value="published" label="Published (Submit for Approval)" disabled={!canPublish} /></RadioGroup></FormControl>{!canPublish && <p className="text-xs text-destructive mt-2">Fill: Name, Category, Description, Price, Stock</p>}</FormItem>)} />
                            <FormField control={form.control} name="complianceConfirmed" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 p-4 border rounded-md"><FormControl><input type="checkbox" checked={field.value || false} onChange={field.onChange} className="h-4 w-4" /></FormControl><FormLabel>I confirm compliance</FormLabel></FormItem>)} />
                        </div>
                        <div className="flex justify-end pt-8 border-t mt-8"><Button onClick={onSaveSection} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Product</Button></div>
                    </AccordionItem>
                </Accordion>
            </Form>
        </div>
    );
}
