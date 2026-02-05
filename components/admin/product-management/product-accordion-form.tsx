"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
	Circle,
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
import { DraftAlert } from "./draft-alert";
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
	// Todo: To be deleted. JkWorkz
	// dimensionLength: z.number().optional(),
	// dimensionWidth: z.number().optional(),
	// dimensionHeight: z.number().optional(),
	// dimensionUnit: z.string().optional(),
	// materials: z.array(z.string()).optional(),
	// features: z.array(z.string()).optional(),
	// performance: z.array(z.string()).optional(),
	// technicalDescription: z.string().optional(),
	// driveTypes: z.array(z.string()).optional(),
	// sizes: z.array(z.string()).optional(),
	// thickness: z.array(z.string()).optional(),
	// colors: z.array(z.string()).optional(),
	// weightValue: z.number().optional(),
	// weightUnit: z.string().optional(),
	// packingLength: z.number().optional(),
	// packingWidth: z.number().optional(),
	// packingHeight: z.number().optional(),
	// packingDimensionUnit: z.string().optional(),
	// packingWeight: z.number().optional(),
	// packingWeightUnit: z.string().optional(),
	// vehicleFitment: z.array(z.string()).optional(),
	// specifications: z.array(z.string()).optional(),
	// Pricing (now includes MOQ)
	basePrice: z.coerce.number().min(0).optional(),
	shippingCharge: z.coerce.number().min(0).optional(),
	packingCharge: z.coerce.number().min(0).optional(),
	currency: z.string().optional(),
	productionLeadTime: z.coerce.number().optional().nullable(),
	minOrderQuantity: z.string().optional(),
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
	readOnly?: boolean;
}

export default function ProductAccordionForm({ productId, domain, readOnly = false }: ProductAccordionFormProps) {
	const isReadOnly = readOnly;
	const router = useRouter();
	const searchParams = useSearchParams();
	const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

	// State
	const [openSections, setOpenSections] = useState<string[]>(isReadOnly ? SECTIONS.map(s => s.slug) : ["basic-info"]);
	const [unlockedSections, setUnlockedSections] = useState<number[]>(isReadOnly ? [1, 2, 3, 4, 5] : [1]);
	const [currentProductId, setCurrentProductId] = useState<string | null>(productId === "new" ? null : productId);
	const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

	// Data Fetching & Hooks
	const { data: specificationsData = [], isLoading: isLoadingSpecs } = useProductSpecifications(currentProductId || null);
	const { data: brands = [], isLoading: isLoadingBrands } = useBrands();
	const { data: mainCategories = [], isLoading: isLoadingCategories } = useMainCategories();

	// Mutations
	const createSpec = useCreateSpecification(currentProductId || null);
	const updateSpec = useUpdateSpecification(currentProductId || null);
	const deleteSpec = useDeleteSpecification(currentProductId || null);
	const bulkUpdateSpecs = useBulkUpdateSpecifications(currentProductId || null);
	const createProductMutation = useCreateProduct();
	const updateProductMutation = useUpdateProduct();
	const { mutateAsync: deleteMedia } = useDeleteProductMedia();
	const { mutateAsync: bulkDeleteMedia } = useBulkDeleteProductMedia();

	const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);
	const [rowsToAdd, setRowsToAdd] = useState<number>(1);

	// Form Definition
	const form = useForm<ProductFormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(productSchema) as any,
		defaultValues: {
			name: "",
			sku: "",
			description: "",
			vehicleCompatibility: "",
			countryOfOrigin: "",
			controlledItemType: "",
			model: "",
			condition: "",
			manufacturingSource: "",
			manufacturingSourceName: "",
			warranty: "",
			warrantyTerms: "",
			supplierSignature: "",
			certifications: [],
			// Todo: To be deleted. JkWorkz
			// materials: [],
			// features: [],
			// performance: [],
			pricingTerms: [],
			pricing_tiers: [],
			individualProductPricing: [],
			gallery: [],
			status: "draft",
			complianceConfirmed: false,
			requiresExportLicense: false,
			hasWarranty: false,
			readyStockAvailable: false,
		},
	});

	// Sync local specs with fetched data
	useEffect(() => {
		if (specificationsData.length > 0) {
			setLocalSpecs(specificationsData);
		} else if (currentProductId && localSpecs.length === 0) {
			setLocalSpecs([{ label: '', value: '', type: 'title_only', active: false, sort: 0 }]);
		}
	}, [specificationsData, currentProductId]);

	// Pricing Fields Arrays
	const { fields: pricingTiers, append: appendPricingTier, remove: removePricingTier } = useFieldArray({
		control: form.control,
		name: "pricing_tiers"
	});

	// Helper to add pricing tier if empty
	const addPricingTier = () => appendPricingTier({ min_quantity: 0, max_quantity: null, price: 0 });

	const { fields: individualPricing, append: appendIndividual, remove: removeIndividual } = useFieldArray({
		control: form.control,
		name: "individualProductPricing"
	});

	const addIndividualProduct = () => appendIndividual({ name: "", amount: 0 });
	const removeIndividualProduct = (index: number) => removeIndividual(index);

	// Array Helpers
	const addArrayItem = (field: any) => {
		const current = form.getValues(field) || [];
		form.setValue(field, [...current, ""], { shouldDirty: true, shouldValidate: true });
	};
	const removeArrayItem = (field: any, index: number) => {
		const current = form.getValues(field) || [];
		form.setValue(field, current.filter((_: any, i: number) => i !== index), { shouldDirty: true, shouldValidate: true });
	};
	const updateArrayItem = (field: any, index: number, value: string) => {
		const current = form.getValues(field) || [];
		const updated = [...current];
		updated[index] = value;
		form.setValue(field, updated, { shouldDirty: true, shouldValidate: true });
	};

	// Specs Helpers
	const getNextSuggestedType = (specs: any[], index: number): 'general' | 'title_only' | 'value_only' => {
		if (index === 0) return 'title_only';
		const prev = specs[index - 1];
		if (!prev) return 'general';
		if (prev.type === 'title_only') return 'general';
		return prev.type;
	};

	// Todo: To be deleted. JkWorkz
	// const validateSpecsRules = () => {
	//     // Simple validation rule checks if needed, for now return true
	//     return true;
	// };

	const updateLocalSpec = (index: number, field: keyof ProductSpecification, val: any) => {
		const updated = [...localSpecs];
		if (!updated[index]) return;
		(updated[index] as any)[field] = val;

		if (field === 'label' || field === 'value') {
			updated[index].active = !!(updated[index].label || updated[index].value);
		}
		setLocalSpecs(updated);
	};

	// Todo: To be deleted. JkWorkz
	// const saveSpecRow = async (index: number) => {
	//     // if (!validateSpecsRules()) return; // Skip complex validation for inline edit
	//     const spec = localSpecs[index];
	//     const dataToSave = {
	//         ...spec,
	//         label: spec.type === 'value_only' ? null : spec.label,
	//         value: spec.type === 'title_only' ? null : spec.value,
	//     };

	//     if (spec.id) {
	//         await updateSpec.mutateAsync({ specId: spec.id, data: dataToSave });
	//     } else {
	//         await createSpec.mutateAsync(dataToSave);
	//     }
	// };

	const deleteSpecRow = async (index: number) => {
		const spec = localSpecs[index];
		if (spec.id) {
			await deleteSpec.mutateAsync(spec.id);
		}
		setLocalSpecs(localSpecs.filter((_, i) => i !== index));
	};

	const addSpecRows = () => {
		const newRows = [];
		for (let i = 0; i < rowsToAdd; i++) {
			newRows.push({
				label: '',
				value: '',
				type: getNextSuggestedType(localSpecs, localSpecs.length + i),
				active: true,
				sort: localSpecs.length + i,
			});
		}
		setLocalSpecs([...localSpecs, ...newRows as ProductSpecification[]]);
	};

	const handlePaste = (e: React.ClipboardEvent, startIndex: number, startField: 'label' | 'value') => {
		e.preventDefault();
		const pasteData = e.clipboardData.getData('text');
		if (!pasteData) return;

		const rows = pasteData.split(/\r\n|\n/).filter(row => row.trim() !== '');
		if (rows.length === 0) return;
		const newSpecs = [...localSpecs];

		rows.forEach((row, i) => {
			const cols = row.split('\t');
			const currentIndex = startIndex + i;

			if (currentIndex >= newSpecs.length) {
				newSpecs.push({
					label: '',
					value: '',
					type: getNextSuggestedType(newSpecs, currentIndex),
					active: true,
					sort: newSpecs.length,
				} as ProductSpecification);
			}

			const spec = newSpecs[currentIndex];

			if (startField === 'label') {
				if (cols[0] !== undefined) spec.label = cols[0].trim();
				if (cols[1] !== undefined) spec.value = cols[1].trim();
			} else {
				if (cols[0] !== undefined) spec.value = cols[0].trim();
			}

			spec.active = !!(spec.label || spec.value);
			if (currentIndex === 0) spec.type = 'title_only';
		});

		setLocalSpecs(newSpecs);
	};

	// Update base price handler placeholder
	const updateBasePrice = () => {
		// Logic to sum individual prices or similar
		const total = individualPricing.reduce((sum, item: any) => sum + (parseFloat(item.amount) || 0), 0);
		form.setValue("basePrice", total);
	};

	// Data fetching
	const { data: product, isLoading: isLoadingProduct, refetch: refetchProduct } = useProduct(currentProductId || "");
	// Duplicates removed

	// Watch form values
	const mainCategoryId = form.watch("mainCategoryId");
	const categoryId = form.watch("categoryId");
	const watchName = form.watch("name");
	const watchSku = form.watch("sku");
	const watchCategories = form.watch("mainCategoryId");
	const watchDesc = form.watch("description");
	const watchPrice = form.watch("basePrice");
	const watchStock = form.watch("stock");
	const watchImage = form.watch("image");
	const watchGallery = form.watch("gallery");
	const watchCompliance = form.watch("complianceConfirmed");
	const watchedPricingTiers = form.watch("pricing_tiers") || [];

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

			// Logic to determine unlocked and open sections
			const newUnlocked: number[] = [1];

			// Check Section 1 (Basic) completeness using server data
			const basicInfoComplete = !!(p.name && p.main_category_id && p.sku && p.description);

			if (basicInfoComplete) {
				// User Rule 4 & 1: If basic info is done, all other keys unlock
				newUnlocked.push(2, 3, 4, 5);
			}

			setUnlockedSections(newUnlocked);

			// Open logic - Rule 5 & 6
			// Find first incomplete
			let firstIncompleteSlug: string | null = null;

			if (!basicInfoComplete) {
				firstIncompleteSlug = 'basic-info';
			} else if (p.base_price === undefined || p.base_price === null) {
				// Section 3 (Pricing) is the next one with required fields (basePrice)
				// Section 2 (Technical) and 4 (Uploads), 5 (Declarations) are optional
				firstIncompleteSlug = 'pricing';
			}

			if (!firstIncompleteSlug) {
				// All requirements met - Rule 6: If all required filled, all open
				setOpenSections(SECTIONS.map(s => s.slug));
				// Rule 5: Open first unfilled required
				setOpenSections([firstIncompleteSlug as string]);
			}
		} else if (!currentProductId) {
			// New Product Mode: Explicitly reset to defaults
			setUnlockedSections([1]);
			setOpenSections(['basic-info']);
		}
	}, [product, currentProductId, form, refetchProduct]);



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
				return !!(watchName && watchCategories && watchSku && watchDesc);
			case 2:
				return true; // Specs are optional
			case 3:
				return watchPrice !== undefined && watchPrice >= 0;
			case 4:
				return !!watchImage; // Media is now required (at least cover image)
			case 5:
				return !!watchCompliance; // Declarations required compliance
			default:
				return false;
		}
	};

	// Can publish validation
	// Can publish validation (now includes SKU, Image and Compliance)
	const canPublish = !!(watchName && watchCategories && watchSku && watchDesc && watchPrice !== undefined && watchPrice >= 0 && watchImage && watchCompliance);

	// Auto-revert to draft if published but requirements no longer met
	useEffect(() => {
		if (!canPublish && form.getValues('status') === 'published') {
			form.setValue('status', 'draft', { shouldValidate: true });
			toast("Status reverted to Draft", { description: "Required fields are missing." });
		}
	}, [canPublish, form.watch('status')]);

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

				// Refetch product data to update server media list immediately OR to unlock sections (if section 1 saved)
				if (sectionId === 4 || sectionId === 1) {
					await refetchProduct();
				}

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
		// Todo: To be deleted. JkWorkz
		// vehicleFitment: 'vehicle_fitment',
		// dimensionLength: 'dimension_length',
		// dimensionWidth: 'dimension_width',
		// dimensionHeight: 'dimension_height',
		// dimensionUnit: 'dimension_unit',
		// weightValue: 'weight_value',
		// weightUnit: 'weight_unit',
		// packingLength: 'packing_length',
		// packingWidth: 'packing_width',
		// packingHeight: 'packing_height',
		// packingDimensionUnit: 'packing_dimension_unit',
		// packingWeight: 'packing_weight',
		// packingWeightUnit: 'packing_weight_unit',
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
		// Todo: To be deleted. JkWorkz
		// driveTypes: 'drive_types',
		// technicalDescription: 'technical_description',
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
					<div className="flex items-center gap-3">
						<h1 className="text-3xl font-bold tracking-tight">
							{currentProductId ? "Edit Product" : "Add New Product"}
						</h1>
						{currentProductId && (
							<div className={cn(
								"px-2.5 py-0.5 rounded-full text-xs font-semibold border",
								form.watch("status") === "published"
									? "bg-green-100 text-green-700 border-green-200"
									: "bg-orange-100 text-orange-700 border-orange-200"
							)}>
								{form.watch("status") === "published" ? "Published" : "Draft"}
							</div>
						)}
					</div>
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

			<DraftAlert
				status={form.watch("status")}
				product={{
					name: form.watch("name"),
					mainCategoryId: form.watch("mainCategoryId"),
					description: form.watch("description"),
					basePrice: form.watch("basePrice"),
					hasCoverImage: !!watchImage,
					complianceConfirmed: !!watchCompliance
				}}
				className="mb-6"
			/>

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
												"px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:border-b",
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
												{!isReadOnly && (
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
												)}
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
			<div className={cn("space-y-4", isReadOnly && "pointer-events-none opacity-80")}>
				{/* Product Name & SKU Row */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="md:col-span-3">
								<FormLabel>Product Name *</FormLabel>
								<FormControl>
									<Input
										placeholder="Clear title (e.g., BR6 Ballistic Glass Kit for Toyota LC300)"
										{...field}
										onKeyUp={handleNameKeyUp}
										disabled={isReadOnly}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="sku"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Product Code / SKU</FormLabel>
								<FormControl>
									<Input {...field} readOnly className="bg-muted text-muted-foreground font-mono text-sm" disabled={isReadOnly} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

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
										disabled={isLoadingCategories || isReadOnly}
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
										disabled={!mainCategoryId || isLoadingSubCategories || isReadOnly}
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
										disabled={!categoryId || isReadOnly}
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
										disabled={isLoadingBrands || isReadOnly}
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
									<Input {...field} disabled={isReadOnly} />
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
										disabled={isReadOnly}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Combined Row for Attributes */}
				<div className="grid gap-4 md:grid-cols-3">
					<FormField
						control={form.control}
						name="controlledItemType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Controlled Item Type</FormLabel>
								<FormControl>
									<Select
										value={field.value || ""}
										onChange={(e) => field.onChange(e.target.value)}
										disabled={isReadOnly}
									>
										<option value="">Select Type</option>
										<option value="Military">Military</option>
										<option value="Dual-Use">Dual-Use</option>
										<option value="Civilian">Civilian</option>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="countryOfOrigin"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country of Origin</FormLabel>
								<FormControl>
									<Select
										value={field.value || ""}
										onChange={(e) => field.onChange(e.target.value)}
										disabled={isReadOnly}
									>
										<option value="">Select Country</option>
										{COUNTRY_LIST.map((country) => (
											<option key={country.countryCode} value={country.countryCode}>
												{country.flag} {country.name}
											</option>
										))}
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="vehicleCompatibility"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Vehicle Compatibility</FormLabel>
								<FormControl>
									<Input
										placeholder="e.g. Toyota Land Cruiser 300..."
										{...field}
										disabled={isReadOnly}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="space-y-3">
					<FormLabel>Certifications</FormLabel>
					<div className="flex flex-col gap-2">
						{(form.watch('certifications') || []).map((_: string, index: number) => (
							<div key={index} className="flex gap-2 items-center">
								<FormField
									control={form.control}
									name={`certifications.${index}`}
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Input
													{...field}
													placeholder="e.g. ISO 9001"
													disabled={isReadOnly}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{!isReadOnly && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="text-red-500 hover:text-red-700 hover:bg-red-50"
										onClick={() => removeArrayItem("certifications", index)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						{!isReadOnly && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="w-fit"
								onClick={() => addArrayItem("certifications")}
							>
								<Plus className="mr-2 h-4 w-4" /> Add Certification
							</Button>
						)}
					</div>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description *</FormLabel>
							<FormControl>
								<div className="border border-input rounded-md overflow-hidden">
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
										editable={!isReadOnly}
									/>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			</div>
		);
	}

	function renderTechnicalSection() {
		return (
			<div className="space-y-6">
				{!currentProductId || isLoadingSpecs ? (
					<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
				) : (
					<>
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full text-sm table-fixed">
								<thead className="bg-[#eadbc8] text-black font-semibold">
									<tr className="border-b border-[#d4c5b0]">
										<th className="w-10 px-3 py-3 text-center">Act.</th>
										<th className="px-3 py-3 text-left">Label</th>
										<th className="px-3 py-3 text-left">Value</th>
										<th className="w-40 px-3 py-3 text-left">Actions</th>
									</tr>
								</thead>
								<tbody className="bg-[#fcfaf5]">
									{localSpecs.map((spec, index) => (
										<tr key={spec.id || `legacy-${index}`} className="border-b border-[#eeeadd] hover:bg-[#f5f1e6] transition-colors">
											<td className="px-3 py-3 text-center">
												<input
													type="checkbox"
													checked={spec.active}
													onChange={(e) => updateLocalSpec(index, 'active', e.target.checked)}
													className="h-5 w-5 rounded border-[#c7bca0] text-primary focus:ring-primary bg-white"
												/>
											</td>
											{spec.type === 'title_only' || spec.type === 'value_only' ? (
												<td colSpan={2} className="px-3 py-3">
													<div className="relative">
														<Input
															value={spec.type === 'title_only' ? spec.label || '' : spec.value || ''}
															onChange={(e) => updateLocalSpec(index, spec.type === 'title_only' ? 'label' : 'value', e.target.value)}
															onPaste={(e) => handlePaste(e, index, spec.type === 'title_only' ? 'label' : 'value')}
															className={`${spec.type === 'title_only' ? 'font-bold bg-[#f2efe4] pl-10 border-[#d9d2c5]' : ''} ${spec.type === 'value_only' ? 'pl-10' : ''} w-full transition-all text-base`}
															placeholder={spec.type === 'title_only' ? 'Section Title' : 'Value'}
														/>
														{spec.type === 'title_only' && (
															<div className="absolute top-0 left-0 bg-orange-600 text-white w-8 h-full flex items-center justify-center rounded-l-lg shadow-sm pointer-events-none opacity-100 z-10">
																<Hash className="w-4 h-4" />
															</div>
														)}
														{spec.type === 'value_only' && (
															<div className="absolute top-0 left-0 bg-[#414e38] text-primary-foreground w-8 h-full flex items-center justify-center rounded-l-md shadow-sm pointer-events-none opacity-90">
																<Circle className="w-2.5 h-2.5 fill-current text-white" />
															</div>
														)}
													</div>
												</td>
											) : (
												<>
													<td className="px-3 py-3 align-top">
														<Input
															value={spec.label || ''}
															onChange={(e) => updateLocalSpec(index, 'label', e.target.value)}
															onPaste={(e) => handlePaste(e, index, 'label')}
															placeholder="Label"
															className="w-full font-medium border-[#d9d2c5] bg-[#f9f7f2] focus:bg-white transition-colors"
															list={`suggestions-legacy-${index}`}
														/>
														<datalist id={`suggestions-legacy-${index}`}>
															{["Condition", "Color", "Size"]
																.filter(opt => !localSpecs.some((s, i) => i !== index && s.label === opt))
																.map(opt => <option key={opt} value={opt} />)
															}
														</datalist>
													</td>
													<td className="px-3 py-3 align-top">
														{(() => {
															const label = spec.label?.trim();

															if (label === 'Condition') {
																return (
																	<select
																		value={spec.value || ''}
																		onChange={(e) => updateLocalSpec(index, 'value', e.target.value)}
																		className="flex h-10 w-full items-center justify-between rounded-md border border-[#d9d2c5] bg-[#ece9de] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
																	>
																		<option value="" disabled>Select Condition</option>
																		<option value="New">New</option>
																		<option value="Used">Used</option>
																		<option value="Refurbished">Refurbished</option>
																	</select>
																);
															}

															if (label === 'Color') {
																const selectedColors = spec.value ? spec.value.split(',').map(s => s.trim()).filter(Boolean) : [];
																return (
																	<MultiSelect
																		options={EXTERNAL_COLORS}
																		selected={selectedColors}
																		onChange={(selected) => updateLocalSpec(index, 'value', selected.join(', '))}
																		placeholder="Select or add Colors..."
																		creatable={true}
																	/>
																);
															}

															if (label === 'Size') {
																const match = (spec.value || '').match(/^([\dx]+)\s*(.*)$/);
																const dimensions = match ? match[1] : (spec.value || '');
																const unit = match ? match[2] : 'mm';

																const updateSizeValue = (newDims: string, newUnit: string) => {
																	updateLocalSpec(index, 'value', `${newDims} ${newUnit}`.trim());
																};

																return (
																	<MaskedSizeInput
																		value={dimensions}
																		unit={unit}
																		onChange={(dims, u) => updateSizeValue(dims, u)}
																	/>
																);
															}

															// Default Text Input
															return (
																<Input
																	value={spec.value || ''}
																	onChange={(e) => updateLocalSpec(index, 'value', e.target.value)}
																	onPaste={(e) => handlePaste(e, index, 'value')}
																	placeholder="Value"
																	className="w-full bg-[#f9f7f2] border-[#d9d2c5] focus:bg-white"
																/>
															);
														})()}
													</td>
												</>
											)}
											<td className="px-3 py-3">
												<div className="flex gap-2 items-center">
													<select
														value={spec.type}
														onChange={(e) => updateLocalSpec(index, 'type', e.target.value)}
														className="h-9 px-2 text-sm border border-[#d9d2c5] rounded bg-[#ece9de] w-[90px] focus:outline-none focus:ring-1 focus:ring-primary/50"
													>
														{index === 0 ? (
															<option value="title_only">Title</option>
														) : (
															<>
																<option value="title_only">Title</option>
																{(() => {
																	const findSectionType = () => {
																		for (let i = index - 1; i >= 0; i--) {
																			if (localSpecs[i].type === 'title_only') return null;
																			return localSpecs[i].type;
																		}
																		return null;
																	};
																	const sectionType = findSectionType();
																	return (
																		<>
																			<option value="general" disabled={sectionType !== null && sectionType !== 'general'}>General</option>
																			<option value="value_only" disabled={sectionType !== null && sectionType !== 'value_only'}>Value</option>
																		</>
																	);
																})()}
															</>
														)}
													</select>
													<Button
														type="button"
														variant="outline"
														size="icon"
														className="h-9 w-9 p-0 aspect-square shrink-0 border-[#e5baba] text-[#c94a4a] bg-[#fff5f5] hover:bg-[#ffe0e0] hover:text-[#a83232] hover:border-[#d99a9a]"
														onClick={() => deleteSpecRow(index)}
														disabled={deleteSpec.isPending}
														title="Delete Row"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}

								</tbody>
							</table>
						</div>
						<div className="flex justify-between mt-4 items-center bg-[#fcfaf5] p-2 rounded border border-[#eaddcf]">
							<div className="flex items-center gap-2">
								<Input
									type="number"
									min="1"
									value={rowsToAdd}
									onChange={(e) => setRowsToAdd(parseInt(e.target.value) || 1)}
									className="w-16 h-9"
								/>
								<Button type="button" variant="outline" size="sm" onClick={addSpecRows}>
									<Plus className="mr-2 h-4 w-4" /> Add Rows
								</Button>
							</div>
						</div>

						<div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3 items-start">
							<Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-semibold text-blue-900">Specification Guidelines</p>
								<ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
									<li>The <strong>first specification</strong> must always be a <strong>Section Title</strong>.</li>
									<li>Within a section, all items must be of the <strong>same type</strong> (either all "General" or all "Value Only") until a new title is added.</li>
									<li>For <strong>Title</strong> types, labels are used as headers. For <strong>Value Only</strong>, values are displayed as bullet points.</li>
								</ul>
							</div>
						</div>
					</>
				)}
			</div>
		);
	}

	function renderPricingSection() {
		return (
			<div className={cn("space-y-6", isReadOnly && "pointer-events-none opacity-80")}>
				<div className="grid gap-4 md:grid-cols-2">
					<FormField control={form.control} name="basePrice" render={({ field }) => <FormItem><FormLabel>Base Price *</FormLabel><Input type="number" step="0.01" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} disabled={isReadOnly} /></FormItem>} />
					<FormField control={form.control} name="currency" render={({ field }) => <FormItem><FormLabel>Currency</FormLabel>
						<Select value={field.value || "AED"} onChange={field.onChange} disabled={isReadOnly}>
							<option value="AED">AED</option>
							<option value="USD">USD</option>
						</Select>
					</FormItem>} />
				</div>

				{/* Combo product Individual pricing Section */}
				<div className="border border-border p-4 rounded-md bg-muted/20">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-semibold text-lg">Combo product Individual pricing</h3>
						<div className="flex gap-2">
							{!isReadOnly && (
								<Button type="button" variant="outline" size="sm" onClick={updateBasePrice} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
									<Save className="h-4 w-4 mr-2" /> Update Base Price
								</Button>
							)}
							{!isReadOnly && (
								<Button type="button" variant="outline" size="sm" onClick={addIndividualProduct}>
									<Plus className="h-4 w-4 mr-2" /> Add product
								</Button>
							)}
						</div>
					</div>

					{individualPricing.map((field, index) => (
						<div key={field.id} className="flex gap-4 items-end mb-4 border-b pb-4 last:border-0 last:pb-0">
							<FormField
								control={form.control}
								name={`individualProductPricing.${index}.name`}
								render={({ field }) => (
									<FormItem className="flex-[2]">
										<FormLabel className="text-xs">Product Name</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Enter product name" disabled={isReadOnly} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`individualProductPricing.${index}.amount`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Amount</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												{...field}
												onChange={e => field.onChange(parseFloat(e.target.value || "0"))}
												disabled={isReadOnly}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{!isReadOnly && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive h-10 w-10 mb-2"
									onClick={() => removeIndividualProduct(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
					{individualPricing.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-4">No individual products added.</p>
					)}
				</div>

				{/* Pricing Tiers Section */}
				<div className="border border-border p-4 rounded-md bg-muted/20">
					<div className="flex justify-between items-center mb-4">
						<h3 className="font-semibold text-lg">Wholesale Pricing Tiers</h3>
						{!isReadOnly && (
							<Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
								<Plus className="h-4 w-4 mr-2" /> Add Tier
							</Button>
						)}
					</div>

					{pricingTiers.map((field, index) => (
						<div key={field.id} className="flex gap-4 items-end mb-4 border-b pb-4 last:border-0 last:pb-0">
							<FormField
								control={form.control}
								name={`pricing_tiers.${index}.min_quantity`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Min Qty</FormLabel>
										<FormControl>
											<Input
												type="number"
												{...field}
												onChange={e => field.onChange(parseInt(e.target.value || "0"))}
												disabled={isReadOnly}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`pricing_tiers.${index}.max_quantity`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Max Qty (Optional)</FormLabel>
										<FormControl>
											<Input
												type="number"
												value={field.value ?? ""}
												onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
												placeholder="∞"
												disabled={isReadOnly}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`pricing_tiers.${index}.price`}
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel className="text-xs">Price</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												{...field}
												onChange={e => field.onChange(parseFloat(e.target.value || "0"))}
												disabled={isReadOnly}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{!isReadOnly && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive h-10 w-10 mb-2"
									onClick={() => removePricingTier(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					))}
					{pricingTiers.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-4">No pricing tiers added.</p>
					)}
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
										disabled={isReadOnly}
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
										placeholder="e.g. 5 Units"
										{...field}
										value={field.value ?? ""}
										disabled={isReadOnly}
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
										disabled={isReadOnly}
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
										disabled={isReadOnly}
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
									<RadioGroupItem value="yes" label="Yes" disabled={isReadOnly} />
									<RadioGroupItem value="no" label="No" disabled={isReadOnly} />
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
			: (form.watch('image') || "");

		const serverMedia = (product as any)?.media || [];
		const galleryMedia = serverMedia.filter((m: any) => !m.is_cover);

		return (
			<div className={cn("space-y-6", isReadOnly && "pointer-events-none opacity-80")}>
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
									onClick={() => !isReadOnly && document.getElementById('cover-upload-input')?.click()}
								>
									{coverPreview ? (
										<div className="relative w-full h-full flex items-center justify-center">
											<img src={coverPreview} alt="Cover Preview" className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm" />
											{!isReadOnly && (
												<div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white font-medium">
													Click to Change
												</div>
											)}
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
										disabled={isReadOnly}
									/>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label className="text-base font-semibold">Gallery Images</Label>
							{galleryMedia.length > 0 && (
								<div className="flex items-center space-x-2 ml-4">
									<Checkbox
										id="select-all-media"
										checked={galleryMedia.length > 0 && selectedMediaIds.size === galleryMedia.length}
										onCheckedChange={(checked) => {
											if (checked) {
												const allIds = galleryMedia.map((m: any) => String(m.id));
												setSelectedMediaIds(new Set(allIds));
											} else {
												setSelectedMediaIds(new Set());
											}
										}}
										className="h-4 w-4"
										disabled={isReadOnly}
									/>
									<label
										htmlFor="select-all-media"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground"
									>
										Select All
									</label>
								</div>
							)}
						</div>
						{selectedMediaIds.size > 0 && !isReadOnly && (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={async () => {
									if (confirm(`Delete ${selectedMediaIds.size} images?`)) {
										try {
											await bulkDeleteMedia({
												productId: currentProductId || "",
												mediaIds: Array.from(selectedMediaIds).map(Number)
											});
											setSelectedMediaIds(new Set());
											toast.success("Selected images deleted");
										} catch (e) {
											toast.error("Failed to delete selected images");
										}
									}
								}}
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Selected ({selectedMediaIds.size})
							</Button>
						)}
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{/* Server Images */}
						{galleryMedia.map((item: any) => (
							<div key={item.id} className="group relative aspect-square border rounded-xl overflow-hidden bg-background shadow-sm">
								<img src={item.url} alt="Gallery" className="w-full h-full object-cover transition-transform group-hover:scale-105" />

								<div className="absolute top-2 left-2 z-10">
									<Checkbox
										checked={selectedMediaIds.has(String(item.id))}
										onCheckedChange={() => {
											const newSet = new Set(selectedMediaIds);
											const idStr = String(item.id);
											if (newSet.has(idStr)) newSet.delete(idStr);
											else newSet.add(idStr);
											setSelectedMediaIds(newSet);
										}}
										className="bg-white/90 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground shadow-sm"
										disabled={isReadOnly}
									/>
								</div>

								{!isReadOnly && (
									<Button
										type="button"
										variant="destructive"
										size="icon"
										className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
										onClick={async () => {
											if (confirm("Delete this image?")) {
												try {
													await deleteMedia({
														productId: currentProductId || "",
														mediaId: String(item.id)
													});
													toast.success("Image deleted");
												} catch (e) {
													toast.error("Failed to delete image");
												}
											}
										}}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						))}

						{/* New Local Files */}
						{galleryFiles.map((file, i) => (
							<div key={`new-${i}`} className="group relative aspect-square border-2 border-primary/50 rounded-xl overflow-hidden bg-background shadow-sm">
								<img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
								{!isReadOnly && (
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
								)}
								<div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-medium shadow-sm pointer-events-none">
									New
								</div>
							</div>
						))}

						{!isReadOnly && (
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
											const newFiles = Array.from(e.target.files);
											setGalleryFiles(prev => [...prev, ...newFiles]);
										}
									}}
									disabled={isReadOnly}
								/>
							</label>
						)}
					</div>
				</div>
			</div>

		);
	}


	function renderDeclarationsSection() {
		return (
			<div className={cn("space-y-4", isReadOnly && "pointer-events-none opacity-80")}>
				<FormField
					control={form.control}
					name="manufacturingSource"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Manufacturing Source</FormLabel>
							<FormControl>
								<Select value={field.value || ""} onChange={field.onChange} disabled={isReadOnly}>
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

				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem className={cn(
							"space-y-3 p-4 border rounded-md transition-colors",
							field.value === "published"
								? "bg-green-100 border-green-300"
								: "bg-orange-100 border-orange-300"
						)}>
							<FormLabel className="text-base font-semibold">Publish Status</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									value={field.value || "draft"}
									className="flex flex-col space-y-1"
								>
									<RadioGroupItem value="draft" label="Draft (Hidden from approval)" disabled={isReadOnly} />
									<RadioGroupItem
										value="published"
										label="Published (Submit for Approval)"
										disabled={!canPublish || isReadOnly}
									/>
								</RadioGroup>
							</FormControl>
							{!canPublish && (
								<div className="text-xs text-destructive mt-2">
									To publish, please ensure the following are filled: Name, Category, Description, Price, Cover Image, Compliance Declaration.
								</div>
							)}
						</FormItem>
					)}
				/>
			</div>
		);
	}
}

const MaskedSizeInput = ({
	value,
	unit,
	onChange
}: {
	value: string,
	unit: string,
	onChange: (dims: string, unit: string) => void
}) => {
	// Value format: "LxWxH"
	const parts = value.split('x');
	const l = parts[0] || '';
	const w = parts[1] || '';
	const h = parts[2] || '';

	// Refs for focus management
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const updatePart = (index: number, val: string) => {
		// Only allow digits
		if (val && !/^\d*$/.test(val)) return;

		const newParts = [l, w, h];
		newParts[index] = val;
		onChange(newParts.join('x'), unit);

		// Auto-focus next input if length reaches 4
		if (val.length === 4 && index < 2) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'x') {
			e.preventDefault();
			// Focus next input
			if (index < 2) {
				inputRefs.current[index + 1]?.focus();
			}
		}
		// Handle Backspace at start of input to jump back
		if (e.key === 'Backspace' && (e.currentTarget.value === '')) {
			if (index > 0) {
				e.preventDefault();
				inputRefs.current[index - 1]?.focus();
			}
		}
	};

	return (
		<div className="flex gap-2">
			<div className="flex-1 flex items-center border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background transition-all overflow-hidden h-10 w-full">
				<Input
					ref={(el) => { inputRefs.current[0] = el }}
					value={l}
					onChange={(e) => updatePart(0, e.target.value)}
					onKeyDown={(e) => handleKeyDown(e, 0)}
					placeholder="000"
					className="border-0 focus-visible:ring-0 px-2 text-center h-full shadow-none w-full min-w-[40px]"
					maxLength={4}
				/>
				<span className="text-muted-foreground font-medium select-none text-xs">x</span>
				<Input
					ref={(el) => { inputRefs.current[1] = el }}
					value={w}
					onChange={(e) => updatePart(1, e.target.value)}
					onKeyDown={(e) => handleKeyDown(e, 1)}
					placeholder="000"
					className="border-0 focus-visible:ring-0 px-2 text-center h-full shadow-none w-full min-w-[40px]"
					maxLength={4}
				/>
				<span className="text-muted-foreground font-medium select-none text-xs">x</span>
				<Input
					ref={(el) => { inputRefs.current[2] = el }}
					value={h}
					onChange={(e) => updatePart(2, e.target.value)}
					onKeyDown={(e) => handleKeyDown(e, 2)}
					placeholder="000"
					className="border-0 focus-visible:ring-0 px-2 text-center h-full shadow-none w-full min-w-[40px]"
					maxLength={4}
				/>
			</div>

			<select
				value={unit}
				onChange={(e) => onChange(value, e.target.value)}
				className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="mm">mm</option>
				<option value="cm">cm</option>
				<option value="m">m</option>
			</select>
		</div>
	);
};


