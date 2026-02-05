"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,

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
import { PatternFormat } from "react-number-format";
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

// Pricing Tier Schema
const pricingTierSchema = z.object({
  min_quantity: z.coerce.number().int().nonnegative().optional().default(0),
  max_quantity: z.union([z.coerce.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
  price: z.coerce.number().nonnegative().optional().default(0),
});

// --- Split Schemas for Tabs ---

// Tab 1: Basic Info
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

// Tab 2: Specs & Variants
const specificationsSchema = z.object({
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
  minOrderQuantity: z.string().optional(),
  vehicleFitment: z.array(z.string()).optional(),
  specifications: z.array(z.string()).optional(),
});

// Tab 3: Pricing & Stock
const pricingSchema = z.object({
  basePrice: z.coerce.number().min(0, "Base price must be greater than or equal to 0").optional(),
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

// Tab 4: Uploads
const mediaSchema = z.object({
  image: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  gallery: z.array(z.string().url()).optional(),
});

// Tab 5: Declarations
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

// Combined schema for type inference (optional usage)
const productSchema = basicInfoSchema
  .merge(specificationsSchema)
  .merge(pricingSchema)
  .merge(mediaSchema)
  .merge(declarationsSchema);

export type ProductFormValues = z.infer<typeof productSchema>;

// Map tabs to schemas
const SCHEMA_MAP: Record<number, z.ZodObject<any>> = {
  1: basicInfoSchema,
  2: specificationsSchema,
  3: pricingSchema,
  4: mediaSchema,
  5: declarationsSchema,
};

const SECTIONS = [
  {
    id: 1,
    name: "Basic Information",
    slug: "basic-info",
    icon: Package,
    fields: [
      "name",
      "sku",
      "mainCategoryId",
      "categoryId",
      "subCategoryId",
      "certifications",
      "controlledItemType",
      "vehicleCompatibility",
      "brandId",
      "model",
      "year",
      "countryOfOrigin",
      "description",
    ],
  },
  {
    id: 2,
    name: "Technical Description",
    slug: "technical",
    icon: Settings,
    fields: [
      "dimensionLength",
      "dimensionWidth",
      "dimensionHeight",
      "dimensionUnit",
      "materials",
      "features",
      "performance",
      "specifications",
      "technicalDescription",
      "vehicleFitment",
      "sizes",
      "thickness",
      "colors",
      "weightValue",
      "weightUnit",
      "packingLength",
      "packingWidth",
      "packingHeight",
      "packingDimensionUnit",
      "packingWeight",
      "packingWeightUnit",
      "minOrderQuantity",
    ],
  },
  {
    id: 3,
    name: "Pricing & Availability",
    slug: "pricing",
    icon: ShoppingCart,
    fields: [
      "basePrice",
      "shippingCharge",
      "packingCharge",
      "currency",
      "pricingTerms",
      "productionLeadTime",
      "readyStockAvailable",
      "stock",
      "condition",
      "pricing_tiers",
      "individualProductPricing",
    ],
  },
  {
    id: 4,
    name: "Uploads & Media",
    slug: "uploads",
    icon: ImageIcon,
    fields: ["image", "gallery"],
  },
  {
    id: 5,
    name: "Declarations",
    slug: "declarations",
    icon: Shield,
    fields: [
      "manufacturingSource",
      "manufacturingSourceName",
      "requiresExportLicense",
      "hasWarranty",
      "warranty",
      "warrantyDuration",
      "warrantyDurationUnit",
      "warrantyTerms",
      "complianceConfirmed",
      "supplierSignature",
      "signatureDate",
    ],
  },
];

/**
 * Helper function to get tab ID from URL slug
 */
const getTabIdFromSlug = (slug: string | null): number => {
  if (!slug) return 1;
  const section = SECTIONS.find(s => s.slug === slug);
  return section?.id || 1;
};

/**
 * Helper function to get URL slug from tab ID
 */
const getSlugFromTabId = (tabId: number): string => {
  const section = SECTIONS.find(s => s.id === tabId);
  return section?.slug || "basic-info";
};

interface ProductFormProps {
  productId: string;
  defaultValues?: Partial<ProductFormValues>;
  isVendor?: boolean;
}

export default function ProductForm({ productId, isVendor = false }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Read initial tab from URL query parameter
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() => getTabIdFromSlug(tabFromUrl));
  const [currentProductId, setCurrentProductId] = useState<string>(productId);

  /**
   * Update URL when tab changes (without triggering React navigation/re-render)
   * Uses window.history.replaceState to update URL without causing component remount
   */
  const updateTabInUrl = (tabId: number) => {
    const slug = getSlugFromTabId(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", slug);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  /**
   * Navigate to next tab after save
   * For new product creation, use router.push to navigate to edit page
   * For updates, just update the URL without full navigation
   */
  const goToNextTab = (productIdForUrl?: string) => {
    const nextTab = Math.min(activeTab + 1, SECTIONS.length);
    setActiveTab(nextTab);

    const slug = getSlugFromTabId(nextTab);
    const basePath = isVendor ? "/vendor/products" : "/admin/products";

    if (productIdForUrl) {
      // New product created - navigate to edit page
      router.push(`${basePath}/${productIdForUrl}/edit?tab=${slug}`);
    } else if (currentProductId) {
      // Existing product update - just update URL without navigation
      const newUrl = `${basePath}/${currentProductId}/edit?tab=${slug}`;
      window.history.replaceState(null, "", newUrl);
    } else {
      // Still on new product page
      const params = new URLSearchParams(window.location.search);
      params.set("tab", slug);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  /**
   * Handle tab change with URL sync (without causing re-render)
   */
  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId);
    updateTabInUrl(tabId);
  };

  // Track initialization to prevent resetting form on re-renders/tab switches
  const initializedId = useRef<string | null>(null);

  const { data: mainCategories = [] } = useMainCategories();

  // File states
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // Specifications state (moved to top level to follow React hooks rules)
  const { data: specificationsData = [], isLoading: isLoadingSpecs } = useProductSpecifications(currentProductId);
  const { data: brands = [], isLoading: isLoadingBrands } = useBrands();
  const createSpec = useCreateSpecification(currentProductId);
  const updateSpec = useUpdateSpecification(currentProductId);
  const deleteSpec = useDeleteSpecification(currentProductId);
  const bulkUpdateSpecs = useBulkUpdateSpecifications(currentProductId);
  const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);
  const [rowsToAdd, setRowsToAdd] = useState<number>(1);

  // Helper functions for specifications
  const getNextSuggestedType = (specs: any[], index: number): 'general' | 'title_only' | 'value_only' => {
    if (index === 0) return 'title_only';
    const prev = specs[index - 1];
    if (!prev) return 'general';
    if (prev.type === 'title_only') return 'general'; // Allow choice after title, default to general
    return prev.type; // Force same type as before in the same section
  };

  // Sync local specs with fetched data, or initialize with one empty row
  useEffect(() => {
    if (specificationsData.length > 0) {
      setLocalSpecs(specificationsData);
    } else if (currentProductId && localSpecs.length === 0) {
      // Start with one empty row (must be title)
      setLocalSpecs([{ label: '', value: '', type: 'title_only', active: false, sort: 0 }]);
    }
  }, [specificationsData, currentProductId]);

  // If productId is provided, fetch product data
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProduct(currentProductId || ""); // Only run if ID exists

  // Refs for resolver access
  const activeTabRef = useRef(activeTab);
  const productIdRef = useRef(currentProductId);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    productIdRef.current = currentProductId;
  }, [currentProductId]);

  // Dynamic Resolver based on active tab
  // This allows validation to default to the current tab's schema in Edit Mode
  const form = useForm<ProductFormValues>({
    resolver: (async (data, context, options) => {
      const isEditMode = !!productIdRef.current;
      const tabId = activeTabRef.current;

      // In Create Mode, we enforce the full schema to ensure integrity before first save
      // In Edit Mode, we only validate the current tab to avoid blocking unrelated field errors (e.g. data loss on unmount)
      const schema = isEditMode && SCHEMA_MAP[tabId]
        ? SCHEMA_MAP[tabId]
        : productSchema;

      const resolverFunc = zodResolver(schema);
      return (resolverFunc as any)(data, context, options);
    }) as Resolver<ProductFormValues>,
    shouldUnregister: false, // CRITICAL: Keep form values when fields are unmounted (switching tabs)
    mode: "onChange",
    defaultValues: {
      name: "",
      sku: "",
      mainCategoryId: undefined,
      categoryId: undefined,
      subCategoryId: undefined, // Note: Ensure these IDs exist in your DB
      certifications: [],
      controlledItemType: "",
      vehicleCompatibility: "",
      brandId: undefined,
      model: "",
      year: undefined,
      countryOfOrigin: "",
      description: "",

      // Technical
      dimensionLength: undefined,
      dimensionWidth: undefined,
      dimensionHeight: undefined,
      dimensionUnit: "mm",
      materials: [],
      features: [],
      performance: [],
      specifications: [],
      technicalDescription: "",
      vehicleFitment: [],
      sizes: [],
      thickness: [],
      colors: [],
      weightValue: undefined,
      weightUnit: "kg",
      packingLength: undefined,
      packingWidth: undefined,
      packingHeight: undefined,
      packingDimensionUnit: "cm",
      packingWeight: undefined,
      packingWeightUnit: "kg",
      minOrderQuantity: undefined,

      // Pricing
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

      // Declarations
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
        month: new Date().getMonth() + 1, // Month is 0-indexed
        year: new Date().getFullYear()
      },

      // Defaults/Placeholders
      isFeatured: false,
      status: "draft",
      actionType: "buy_now",
      driveTypes: [],
      gallery: [],
    },
  });

  // Populate form with product data when loaded (Edit Mode)
  useEffect(() => {
    if (productId && product) {
      const productData = product as unknown as Record<string, unknown>;



      // Map basic fields
      // Helper to get value from either camelCase or snake_case
      const getVal = (k1: string, k2: string) => (productData[k1] !== undefined ? productData[k1] : productData[k2]);

      const parseNumber = (val: any): number | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      };

      const formData: Partial<ProductFormValues> = {
        name: (productData.name as string) || "",
        sku: (productData.sku as string) || "",
        basePrice:
          parseNumber(getVal("basePrice", "base_price")) ||
          parseNumber(getVal("price", "price")) ||
          0,
        shippingCharge: parseNumber(getVal("shippingCharge", "shipping_charge")),
        packingCharge: parseNumber(getVal("packingCharge", "packing_charge")),
        currency: (getVal("currency", "currency") as string) || "AED",
        condition: (getVal("condition", "condition") as string) || "new",

        // Dimensions
        dimensionUnit: (getVal("dimensionUnit", "dimension_unit") as string) || "mm",
        dimensionLength: parseNumber(getVal("dimensionLength", "dimension_length")),
        dimensionWidth: parseNumber(getVal("dimensionWidth", "dimension_width")),
        dimensionHeight: parseNumber(getVal("dimensionHeight", "dimension_height")),

        // Weight
        weightValue: parseNumber(getVal("weightValue", "weight_value")),
        weightUnit: (getVal("weightUnit", "weight_unit") as string) || "kg",

        // Packing
        packingLength: parseNumber(getVal("packingLength", "packing_length")),
        packingWidth: parseNumber(getVal("packingWidth", "packing_width")),
        packingHeight: parseNumber(getVal("packingHeight", "packing_height")),
        packingDimensionUnit: (getVal("packingDimensionUnit", "packing_dimension_unit") as string) || "cm",
        packingWeight: parseNumber(getVal("packingWeight", "packing_weight")),
        packingWeightUnit: (getVal("packingWeightUnit", "packing_weight_unit") as string) || "kg",

        minOrderQuantity: String(getVal("minOrderQuantity", "min_order_quantity") ?? ""),
        productionLeadTime: parseNumber(getVal("productionLeadTime", "production_lead_time")),

        // Declarations
        manufacturingSource: (getVal("manufacturingSource", "manufacturing_source") as string) || "",
        manufacturingSourceName: (getVal("manufacturingSourceName", "manufacturing_source_name") as string) || "",

        readyStockAvailable: (getVal("readyStockAvailable", "ready_stock_available") as boolean) ?? false,
        requiresExportLicense: (getVal("requiresExportLicense", "requires_export_license") as boolean) ?? false,
        hasWarranty: (getVal("hasWarranty", "has_warranty") as boolean) ?? false,
        complianceConfirmed: (getVal("complianceConfirmed", "compliance_confirmed") as boolean) ?? false,

        warrantyDuration: (getVal("warrantyDuration", "warranty_duration") as number) || undefined,
        warrantyDurationUnit: (getVal("warrantyDurationUnit", "warranty_duration_unit") as string) || "months",
        warrantyTerms: (getVal("warrantyTerms", "warranty_terms") as string) || "",
        supplierSignature: (getVal("supplierSignature", "supplier_signature") as string) || "",

        warranty: (productData.warranty as string) || "",
        technicalDescription: (getVal("technicalDescription", "technical_description") as string) || "",
        description: (productData.description as string) || "",

        vehicleCompatibility: (getVal("vehicleCompatibility", "vehicle_compatibility") as string) || "",
        certifications: (() => {
          const val = productData.certifications;
          if (Array.isArray(val)) return val as string[];
          if (typeof val === 'string' && val.trim() !== '') {
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : [val];
            } catch (e) {
              return val ? [val] : [];
            }
          }
          return [];
        })(),
        countryOfOrigin: (getVal("countryOfOrigin", "country_of_origin") as string) || "",
        controlledItemType: (getVal("controlledItemType", "controlled_item_type") as string) || "",

        brandId: parseNumber(getVal("brandId", "brand_id") as string | number) || (productData.brand as any)?.id || undefined,
        model: (productData.model as string) || "",
        year: productData.year as number | undefined,

        isFeatured: (productData.isFeatured as boolean) ?? false,
        stock: productData.stock as number | undefined,

        image:
          (productData.image as string) ||
          (productData.imageUrl as string) ||
          "",

        // Map arrays safely - check both keys
        materials: Array.isArray(getVal("materials", "materials")) ? (getVal("materials", "materials") as string[]) : [],
        features: Array.isArray(getVal("features", "features")) ? (getVal("features", "features") as string[]) : [],
        performance: Array.isArray(getVal("performance", "performance")) ? (getVal("performance", "performance") as string[]) : [],
        specifications: (() => {
          const val = getVal("specifications", "specifications");
          if (Array.isArray(val)) return val as string[];
          if (typeof val === 'string' && val.trim() !== '') {
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              return [];
            }
          }
          return [];
        })(),
        sizes: Array.isArray(getVal("sizes", "sizes")) ? (getVal("sizes", "sizes") as string[]) : [],
        thickness: Array.isArray(getVal("thickness", "thickness")) ? (getVal("thickness", "thickness") as string[]) : [],
        colors: Array.isArray(getVal("colors", "colors")) ? (getVal("colors", "colors") as string[]) : [],

        vehicleFitment: (() => {
          const val = getVal("vehicleFitment", "vehicle_fitment");
          if (Array.isArray(val)) return val as string[];
          if (typeof val === 'string' && val.trim() !== '') {
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              return [];
            }
          }
          return [];
        })(),

        pricingTerms: Array.isArray(getVal("pricingTerms", "pricing_terms"))
          ? (getVal("pricingTerms", "pricing_terms") as string[])
          : [],

        gallery: Array.isArray(productData.gallery)
          ? (productData.gallery as string[])
          : [],

        pricing_tiers: Array.isArray(productData.pricing_tiers)
          ? (productData.pricing_tiers as any[]).map(t => ({
            min_quantity: t.min_quantity,
            max_quantity: t.max_quantity,
            price: t.price
          }))
          : [],

        individualProductPricing: Array.isArray(getVal("individualProductPricing", "individual_product_pricing"))
          ? (getVal("individualProductPricing", "individual_product_pricing") as any[])
          : [],

        // Date Handling
        signatureDate: (() => {
          const val = getVal("signatureDate", "submission_date");

          if (typeof val === 'string') {
            // Check if ISO string, take YYYY-MM-DD
            // If just "YYYY-MM-DD"
            const datePart = val.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
              return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]),
                day: parseInt(parts[2])
              };
            }
          }

          if (val && typeof val === 'object' && 'day' in val) {
            return val as { day?: number; month?: number; year?: number };
          }

          // Default to today if missing
          const now = new Date();
          return {
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear()
          };
        })(),

        // Map Categories (IMPORTANT: Ensure IDs are numbers)
        mainCategoryId: (productData.mainCategoryId as number) || (productData.main_category_id as number) || (productData.main_category as any)?.id || undefined,
        categoryId: (productData.categoryId as number) || (productData.category_id as number) || (productData.category as any)?.id || undefined,
        subCategoryId: (productData.subCategoryId as number) || (productData.sub_category_id as number) || (productData.sub_category as any)?.id || undefined,

        // Status
        status: (productData.status as string) || "draft",
      };

      // Only reset if we haven't initialized this product ID yet
      // This prevents overwriting user edits if 'product' refetches or component re-renders
      if (initializedId.current !== productId) {
        form.reset(formData as ProductFormValues);
        initializedId.current = productId;
      }
    }
  }, [productId, product, form]);

  // Watch mainCategoryId to fetch categories when it changes
  const mainCategoryId = form.watch("mainCategoryId");
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategoriesByParent(mainCategoryId || undefined);

  // Watch categoryId to fetch subcategories when it changes
  const categoryId = form.watch("categoryId");
  const { data: subCategories = [], isLoading: isLoadingSubCategories } =
    useCategoriesByParent(categoryId || undefined);

  // Controlled Item Visibility Logic
  const subCategoryId = form.watch("subCategoryId");

  const isControlledItemVisible = (() => {
    const main = mainCategories.find(c => c.id === mainCategoryId);
    const cat = categories.find(c => c.id === categoryId);
    const sub = subCategories.find(c => c.id === subCategoryId);

    // Check both snake_case and camelCase just in case, based on Service interface
    return (
      !!main?.is_controlled || !!main?.isControlled ||
      !!cat?.is_controlled || !!cat?.isControlled ||
      !!sub?.is_controlled || !!sub?.isControlled
    );
  })();



  const materials = form.watch("materials") || [];
  const features = form.watch("features") || [];
  const performance = form.watch("performance") || [];
  const specifications = form.watch("specifications") || [];
  const sizes = form.watch("sizes") || [];
  const thickness = form.watch("thickness") || [];
  const colors = form.watch("colors") || [];
  const vehicleFitment = form.watch("vehicleFitment") || [];
  const pricingTerms = form.watch("pricingTerms") || [];
  const gallery = form.watch("gallery") || [];
  const pricingTiers = form.watch("pricing_tiers") || [];

  // Watch required fields
  const watchName = form.watch("name");
  const watchCategories = form.watch("mainCategoryId"); // At least one category
  const watchPrice = form.watch("basePrice");
  const watchStock = form.watch("stock");
  const watchDesc = form.watch("description");

  /**
   * Step-specific validation for required fields
   * Only validates the current step's requirements
   */
  const getStepValidation = (step: number): { isValid: boolean; message: string } => {
    switch (step) {
      case 1: // Basic Info - Name, Category, Description required
        const step1Valid = !!(watchName && watchCategories && watchDesc);
        return {
          isValid: step1Valid,
          message: step1Valid ? "" : "Required: Name, Category, Description"
        };
      case 2: // Specs & Variants - No required fields
        return { isValid: true, message: "" };
      case 3: // Pricing & Stock - Price, Quantity required
        const step3Valid = (watchPrice !== undefined && watchPrice >= 0) && (watchStock !== undefined && watchStock >= 0);
        return {
          isValid: step3Valid,
          message: step3Valid ? "" : "Required: Price, Quantity"
        };
      case 4: // Uploads - No required fields
        return { isValid: true, message: "" };
      case 5: // Declarations - No required fields
        return { isValid: true, message: "" };
      default:
        return { isValid: true, message: "" };
    }
  };

  // Get current step validation
  const currentStepValidation = getStepValidation(activeTab);
  const canProceed = currentStepValidation.isValid;

  // Full form validation for publishing (all required fields across all steps)
  const canPublish = !!(
    watchName &&
    watchCategories &&
    (watchPrice !== undefined && watchPrice >= 0) &&
    (watchStock !== undefined && watchStock >= 0) &&
    watchDesc
  );

  const addArrayItem = (
    fieldName:
      | "materials"
      | "features"
      | "performance"
      | "specifications"
      | "driveTypes"
      | "sizes"
      | "thickness"
      | "colors"
      | "vehicleFitment"
      | "pricingTerms"
      | "gallery"
      | "certifications"
  ) => {
    const current = form.getValues(fieldName) || [];
    // @ts-ignore
    form.setValue(fieldName, [...current, ""]);
  };

  const { mutateAsync: deleteMedia } = useDeleteProductMedia();
  const { mutateAsync: bulkDeleteMedia } = useBulkDeleteProductMedia();
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());

  const handleToggleSelect = (mediaId: number) => {
    const newSelected = new Set(selectedMediaIds);
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId);
    } else {
      newSelected.add(mediaId);
    }
    setSelectedMediaIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedMediaIds.size === 0) return;
    if (!currentProductId) return;

    try {
      await bulkDeleteMedia({ productId: currentProductId, mediaIds: Array.from(selectedMediaIds) });

      // Optimistic UI Update
      const currentGallery = form.getValues('gallery') || [];
      const newGallery = currentGallery.filter((url: string) => {
        // Keep it if it's NOT in the selected list
        // We need to match URL to ID again to be safe, or relies on invalidation
        // But invalidation happens on success. 
        // Ideally we just wait for query refresh or filter out based on URL matching

        // Find media ID for this URL
        const mediaItem = (product as any)?.media?.find((m: any) =>
          m.url === url || url.endsWith(m.url) || (m.url && m.url.endsWith(url))
        );

        if (mediaItem && selectedMediaIds.has(mediaItem.id)) {
          return false; // Remove
        }
        return true;
      });

      form.setValue('gallery', newGallery);

      setSelectedMediaIds(new Set());
      toast.success(`Deleted ${selectedMediaIds.size} images`);
    } catch (error) {
      console.error("Bulk delete failed", error);
      toast.error("Failed to delete images");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Find all server-side images
      const currentGallery = form.getValues('gallery') || [];
      const idsToSelect = new Set<number>();

      currentGallery.forEach((url: string) => {
        const mediaItem = (product as any)?.media?.find((m: any) =>
          m.url === url || url.endsWith(m.url) || (m.url && m.url.endsWith(url))
        );
        if (mediaItem) {
          idsToSelect.add(mediaItem.id);
        }
      });
      setSelectedMediaIds(idsToSelect);
    } else {
      setSelectedMediaIds(new Set());
    }
  };

  const removeArrayItem = async (fieldName: any, index: number) => {
    const current = form.getValues(fieldName) || [];

    if (fieldName === 'gallery') {
      // Special handling for gallery to delete from server if it's an existing URL
      const itemToDelete = current[index];
      if (typeof itemToDelete === 'string' && itemToDelete.startsWith('http') && currentProductId) {
        // Find media ID from product object
        const mediaItem = (product as any)?.media?.find((m: any) =>
          m.url === itemToDelete || itemToDelete.endsWith(m.url) || (m.url && m.url.endsWith(itemToDelete))
        );

        if (mediaItem) {
          try {
            await deleteMedia({ productId: currentProductId, mediaId: String(mediaItem.id) });
            toast.success("Image deleted successfully");
          } catch (error) {
            console.error("Failed to delete image", error);
            toast.error("Failed to delete image");
            return; // Don't remove from UI if API failed
          }
        }
      }
    }

    form.setValue(
      fieldName,
      current.filter((_: any, i: number) => i !== index)
    );
  };

  const updateArrayItem = (fieldName: any, index: number, value: string) => {
    const current = form.getValues(fieldName) || [];
    const updated = [...current];
    updated[index] = value;
    form.setValue(fieldName, updated);
  };

  // Pricing Tier Helpers
  const addPricingTier = () => {
    const current = form.getValues("pricing_tiers") || [];
    form.setValue("pricing_tiers", [
      ...current,
      { min_quantity: 0, max_quantity: null, price: 0 },
    ]);
  };

  const removePricingTier = (index: number) => {
    const current = form.getValues("pricing_tiers") || [];
    form.setValue(
      "pricing_tiers",
      current.filter((_, i) => i !== index)
    );
  };

  const addIndividualProduct = () => {
    const current = form.getValues("individualProductPricing") || [];
    form.setValue("individualProductPricing", [
      ...current,
      { name: "", amount: 0 },
    ]);
  };

  const removeIndividualProduct = (index: number) => {
    const current = form.getValues("individualProductPricing") || [];
    form.setValue(
      "individualProductPricing",
      current.filter((_, i) => i !== index)
    );
  };

  const updateBasePrice = () => {
    const items = form.getValues("individualProductPricing") || [];
    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    form.setValue("basePrice", total);
    toast.success(`Base price updated to ${total} based on individual costs.`);
  };



  /**
   * Generate a random SKU with fixed format: SKU-XXXXXX
   * Where X is uppercase alphanumeric (A-Z, 0-9)
   */
  const generateSku = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SKU-${code}`;
  };

  const handleNameKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only auto-generate SKU for new products if SKU is empty
    const currentSku = form.getValues("sku");
    if (!currentProductId && !currentSku) {
      form.setValue("sku", generateSku(), { shouldValidate: true });
    }
  };

  // Mapping from Form (camelCase) to API (snake_case)
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
    signatureDate: 'submission_date', // Special format handling needed
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
    brandId: 'brand_id'
  };

  const cleanDataForApi = (
    data: ProductFormValues,
    fields: string[]
  ): Record<string, unknown> => {
    const cleanedData: Record<string, unknown> = {};

    fields.forEach((field) => {
      const value = data[field as keyof ProductFormValues];
      const apiField = FIELD_MAPPING[field] || field;

      if (field === "signatureDate") {
        if (value && typeof value === "object") {
          const dateValue = value as {
            day?: number;
            month?: number;
            year?: number;
          };
          if (dateValue.day && dateValue.month && dateValue.year) {
            // Create ISO date string YYYY-MM-DD
            const dateStr = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
            cleanedData[apiField] = dateStr;
          }
        }
      } else if (field === "pricing_tiers" || field === "individualProductPricing") {
        // Pass through object arrays without string filtering
        if (value) {
          cleanedData[apiField] = value;
        }
      } else if (Array.isArray(value)) {
        // Filter empty strings from arrays
        const filtered = value.filter((item) => item !== "");
        // Send empty arrays too, to clear data if needed, or at least dependent on requirement. 
        // For now, only send if not empty to match previous logic, BUT for reset/clearing we might need to send empty.
        // Let's keep existing logic: send if > 0. 
        if (filtered.length > 0) {
          cleanedData[apiField] = filtered;
        }
      } else if (value !== "" && value !== undefined && value !== null) {
        cleanedData[apiField] = value;
      }
    });

    return cleanedData;
  };

  const validateSpecsRules = (): boolean => {
    if (localSpecs.length === 0) return true;

    // Rule 1: First spec must be title
    if (localSpecs[0].type !== 'title_only') {
      toast.warning('The first specification must always be a Section Title.');
      return false;
    }

    // Rule 2: Section consistency
    let currentSectionType: string | null = null;
    let sectionStartTitle = localSpecs[0].label || 'Initial Section';

    for (let i = 0; i < localSpecs.length; i++) {
      const spec = localSpecs[i];
      if (spec.type === 'title_only') {
        currentSectionType = null;
        sectionStartTitle = spec.label || `Section at row ${i + 1}`;
      } else {
        if (currentSectionType === null) {
          currentSectionType = spec.type;
        } else if (spec.type !== currentSectionType) {
          toast.warning(`Rule violation in "${sectionStartTitle}": You cannot mix General and Value Only items in the same section (Row ${i + 1}).`);
          return false;
        }
      }
    }
    return true;
  };

  const onSubmit = async (formData: ProductFormValues) => {
    try {
      // Handle Technical Specs Saving (Tab 2)
      if (currentProductId && activeTab === 2) {
        if (!validateSpecsRules()) return;
        await bulkUpdateSpecs.mutateAsync(localSpecs);
        // Continue to save other product fields if needed, or just return/toast/navigate?
        // The user wants "Save Changes" to save specs AND go to next tab.
        // We usually also save the product form data (e.g. if they edited other fields even though they are hidden? No, hidden fields won't be edited by user but might exist in form state).
        // Let's proceed with standard product update as well to be safe, especially if there are other fields on this tab like 'technicalDescription' (which we are hiding but model has it).
      }

      const allFields = [...SECTIONS.flatMap(s => s.fields), "status"];
      const cleanedData = cleanDataForApi(formData, allFields);

      // Create FormData
      const fd = new FormData();

      // Append all data fields
      Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key];
        if (value === undefined || value === null) return;

        // Arrays and Objects (except File) should be stringified
        if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof File))) {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, String(value));
        }
      });

      // Append Files
      if (coverImageFile) {
        fd.append('coverImage', coverImageFile);
      }

      // Append Gallery Files
      galleryFiles.forEach(file => {
        fd.append('files', file);
      });

      if (!currentProductId) {
        // CREATE
        // Only validate Step 1 fields
        // Note: The form validation already happened via handleSubmit, but we should ensure we are on step 1

        const response = await createProductMutation.mutateAsync(
          fd as unknown as CreateProductRequest
        );

        const productResponse = response as
          | Product
          | { data?: Product; id?: string };
        const newProductId =
          (productResponse as Product).id ||
          (productResponse as { data?: Product }).data?.id ||
          (productResponse as { id?: string }).id;

        if (newProductId) {
          setCurrentProductId(String(newProductId));
          toast.success("Product created successfully!");
          // Navigate to the edit page with the next tab
          goToNextTab(String(newProductId));
        } else {
          throw new Error("Product ID not found in response");
        }
      } else {
        // UPDATE
        await updateProductMutation.mutateAsync({
          id: currentProductId,
          data: fd as unknown as UpdateProductRequest,
        });
        toast.success("Product updated successfully!");
        // Navigate to next tab after successful update
        goToNextTab();
      }
    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.error ||
        "Operation failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const renderStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid gap-4 md:grid-cols-3 py-6">
                <FormField
                  control={form.control}
                  name="mainCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Main Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                            form.setValue("categoryId", undefined);
                            form.setValue("subCategoryId", undefined);
                          }}
                          placeholder="Select Main Category"
                          disabled={isLoadingCategories}
                        >
                          {mainCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Category</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                            form.setValue("subCategoryId", undefined);
                          }}
                          placeholder="Select Category"
                          disabled={!mainCategoryId || isLoadingSubCategories}
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
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
                  name="subCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Subcategory</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                          }}
                          placeholder="Select Subcategory"
                          disabled={!categoryId || isLoadingSubCategories}
                        >
                          {subCategories.map((subCategory) => (
                            <option key={subCategory.id} value={subCategory.id}>
                              {subCategory.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Additional fields for Step 1 would be here (sku, certifications, etc) - keeping concise for now based on original file structure, ensuring all fields are present */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code / SKU (Auto-generated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-generated"
                        {...field}
                        readOnly
                        className="bg-muted text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <Label className="mb-2 block">Certifications / Standards</Label>
                  {(form.watch("certifications") || []).map((item: string, index: number) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={item}
                        placeholder="e.g., CEN BR6"
                        onChange={e => updateArrayItem("certifications", index, e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem("certifications", index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("certifications")}>
                    <Plus className="mr-2 h-4 w-4" /> Add Certification
                  </Button>
                </div>
                {isControlledItemVisible && (
                  <FormField
                    control={form.control}
                    name="controlledItemType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-destructive font-medium">Controlled Item Type *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ITAR / Dual-Use" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicleCompatibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Compatibility</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota Land Cruiser" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => {
                    const [countrySearch, setCountrySearch] = useState("");
                    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

                    const filteredCountries = COUNTRY_LIST.filter((country) =>
                      country.name.toLowerCase().includes((countrySearch || field.value || "").toLowerCase())
                    ).slice(0, 10);

                    return (
                      <FormItem className="relative">
                        <FormLabel>Country of Origin (Add Custom Text if needed)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Type to search or enter custom value"
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                setCountrySearch(e.target.value);
                                setShowCountryDropdown(true);
                              }}
                              onFocus={() => setShowCountryDropdown(true)}
                              onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                            />
                            {showCountryDropdown && filteredCountries.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                {filteredCountries.map((country) => (
                                  <div
                                    key={country.countryCode}
                                    className="px-3 py-2 cursor-pointer hover:bg-accent flex items-center gap-2"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      field.onChange(country.name);
                                      setShowCountryDropdown(false);
                                    }}
                                  >
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
                            // Optional: Reset model if needed, but usually Brand has independent Models? 
                            // Or keep Model free text.
                          }}
                          placeholder="Select Brand"
                          disabled={isLoadingBrands}
                        >
                          {brands.map((brand: any) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
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
                  name="model"
                  render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : parseInt(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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

                          try {
                            const response = await api.post('/upload/files', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });

                            // Verify response structure
                            // API returns data as array of strings: ["path/to/file"]
                            if (response.data?.status && Array.isArray(response.data?.data) && response.data.data.length > 0) {
                              const filePath = response.data.data[0];
                              // Construct full URL assuming local server or using environment variable base
                              // We take the API URL (e.g. http://localhost:3002/api/v1) and remove /api/v1 to get root
                              const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
                              const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '');
                              const fullUrl = `${baseUrl}/${filePath}`;

                              return {
                                url: fullUrl,
                                type: file.type.startsWith('image/') ? 'image' : 'file',
                                name: file.name
                              };
                            } else {
                              throw new Error("Invalid response from server");
                            }
                          } catch (error) {
                            console.error("Upload failed", error);
                            throw error;
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>
        );
      case 2:
        const addSpecRows = () => {
          const newSpecs = [...localSpecs];
          for (let i = 0; i < rowsToAdd; i++) {
            const nextIndex = newSpecs.length;
            newSpecs.push({
              label: '',
              value: '',
              type: getNextSuggestedType(newSpecs, nextIndex),
              active: false,
              sort: nextIndex,
            });
          }
          setLocalSpecs(newSpecs);
        };

        const updateLocalSpec = (index: number, field: keyof ProductSpecification, val: any) => {
          const updated = [...localSpecs];
          (updated[index] as any)[field] = val;
          if (field === 'label' || field === 'value') {
            updated[index].active = !!(updated[index].label || updated[index].value);
          }
          setLocalSpecs(updated);
        };



        const saveSpecRow = async (index: number) => {
          if (!validateSpecsRules()) return;
          const spec = localSpecs[index];
          // Sanitize
          const dataToSave = {
            ...spec,
            label: spec.type === 'value_only' ? null : spec.label,
            value: spec.type === 'title_only' ? null : spec.value,
          };

          if (spec.id) {
            await updateSpec.mutateAsync({ specId: spec.id, data: dataToSave });
          } else {
            await createSpec.mutateAsync(dataToSave);
          }
        };

        const deleteSpecRow = async (index: number) => {
          const spec = localSpecs[index];
          if (spec.id) {
            await deleteSpec.mutateAsync(spec.id);
          }
          setLocalSpecs(localSpecs.filter((_, i) => i !== index));
        };


        const saveAllSpecs = async () => {
          if (!validateSpecsRules()) return;
          await bulkUpdateSpecs.mutateAsync(localSpecs);
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

            // Create new row if needed
            if (currentIndex >= newSpecs.length) {
              newSpecs.push({
                label: '',
                value: '',
                type: getNextSuggestedType(newSpecs, currentIndex),
                active: true,
                sort: newSpecs.length,
              });
            }

            const spec = newSpecs[currentIndex];

            // Map columns based on startField
            if (startField === 'label') {
              if (cols[0] !== undefined) spec.label = cols[0].trim();
              if (cols[1] !== undefined) spec.value = cols[1].trim();
              // Optional: Try to map 3rd column to Type
              if (cols[2] !== undefined) {
                const typeVal = cols[2].trim().toLowerCase();
                if (currentIndex === 0) {
                  spec.type = 'title_only';
                } else if (['general', 'title_only', 'value_only'].includes(typeVal)) {
                  spec.type = typeVal as any;
                } else if (typeVal === 'title') {
                  spec.type = 'title_only';
                } else if (typeVal === 'value') {
                  spec.type = 'value_only';
                }
              }
            } else { // startField === 'value'
              if (cols[0] !== undefined) spec.value = cols[0].trim();
            }

            // Auto-activate
            spec.active = !!(spec.label || spec.value);

            // Sanitize based on Type
            // @ts-ignore
            if (spec.type === 'value_only') spec.label = null;
            // @ts-ignore
            if (spec.type === 'title_only') spec.value = null;

            // First row MUST be title_only regardless of paste content
            if (currentIndex === 0) spec.type = 'title_only';

            // Update sort order just in case
            spec.sort = currentIndex;
          });

          setLocalSpecs(newSpecs);
        };



        return (
          <div className="space-y-6">
            {/* SPECIFICATIONS TABLE - NEW SECTION */}
            {currentProductId && (
              <Card>
                <CardHeader>
                  <CardTitle>SPECIFICATIONS</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSpecs ? (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  ) : (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm table-fixed">
                          <thead className="bg-muted">
                            <tr>
                              <th className="w-10 px-2 py-2 text-center">Act.</th>
                              <th className="px-2 py-2 text-left">Label</th>
                              <th className="px-2 py-2 text-left">Value</th>
                              <th className="w-32 px-2 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {localSpecs.map((spec, index) => (
                              <tr key={spec.id || `new-${index}`} className="border-t">
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={spec.active}
                                    onChange={(e) => updateLocalSpec(index, 'active', e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                </td>
                                {spec.type === 'title_only' || spec.type === 'value_only' ? (
                                  <td colSpan={2} className="px-2 py-2">
                                    <div className="relative">
                                      <Input
                                        value={spec.type === 'title_only' ? spec.label || '' : spec.value || ''}
                                        onChange={(e) => updateLocalSpec(index, spec.type === 'title_only' ? 'label' : 'value', e.target.value)}
                                        onPaste={(e) => handlePaste(e, index, spec.type === 'title_only' ? 'label' : 'value')}
                                        className={`${spec.type === 'title_only' ? 'font-bold bg-muted/50 pl-10 border-primary/20' : ''} ${spec.type === 'value_only' ? 'pl-10' : ''} w-full transition-all`}
                                        placeholder={spec.type === 'title_only' ? 'Section Title' : 'Value'}
                                      />
                                      {spec.type === 'title_only' && (
                                        <div className="absolute top-0 left-0 bg-orange-600 text-white w-8 h-full flex items-center justify-center rounded-l-lg shadow-sm pointer-events-none opacity-100 z-10">
                                          <Hash className="w-4 h-4" />
                                        </div>
                                      )}
                                      {spec.type === 'value_only' && (
                                        <div className="absolute top-0 left-0 bg-primary text-primary-foreground w-8 h-full flex items-center justify-center rounded-l-md shadow-sm pointer-events-none opacity-90">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-2 py-2 align-top">
                                      <div className="relative group">
                                        {/* Label Input with Suggestions */}
                                        <Input
                                          value={spec.label || ''}
                                          onChange={(e) => updateLocalSpec(index, 'label', e.target.value)}
                                          onPaste={(e) => handlePaste(e, index, 'label')}
                                          placeholder="Label"
                                          className="w-full font-medium border-primary/30 bg-muted/10"
                                          list={`suggestions-${index}`}
                                        />
                                        <datalist id={`suggestions-${index}`}>
                                          {["Condition", "Color", "Size"]
                                            .filter(opt => !localSpecs.some((s, i) => i !== index && s.label === opt))
                                            .map(opt => <option key={opt} value={opt} />)
                                          }
                                        </datalist>
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 align-top">
                                      {/* Dynamic Value Input */}
                                      {(() => {
                                        const label = spec.label?.trim();

                                        if (label === 'Condition') {
                                          return (
                                            <select
                                              value={spec.value || ''}
                                              onChange={(e) => updateLocalSpec(index, 'value', e.target.value)}
                                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                          // Parse composite value "11x11x11 mm"
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
                                            className="w-full"
                                          />
                                        );
                                      })()}
                                    </td>
                                  </>
                                )}
                                <td className="px-2 py-2">
                                  <div className="flex gap-1 items-center">
                                    <select
                                      value={spec.type}
                                      onChange={(e) => updateLocalSpec(index, 'type', e.target.value)}
                                      className="h-8 px-1 text-xs border rounded bg-background w-20"
                                    >
                                      {/* Rule: First row must be title */}
                                      {index === 0 ? (
                                        <option value="title_only">Title</option>
                                      ) : (
                                        <>
                                          <option value="title_only">Title</option>
                                          {/* Rule: Once general/value started in a section, stick to it */}
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
                                      className="h-8 w-8 p-0 aspect-square shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-black dark:hover:text-white"
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
                      <div className="flex justify-between mt-4 items-center">
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
                        {/* <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={saveAllSpecs}
                          disabled={bulkUpdateSpecs.isPending}
                        >
                          {bulkUpdateSpecs.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save All
                        </Button> */}
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
                  )
                  }
                </CardContent >
              </Card >
            )
            }

            {/* <Card>
              <CardHeader>
                <CardTitle>TECHNICAL SPECIFICATIONS:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="dimensionLength"
                    render={({ field }) => (
                      <FormItem><FormLabel>Length</FormLabel><FormControl><Input type="number" step="0.1" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimensionWidth"
                    render={({ field }) => (
                      <FormItem><FormLabel>Width</FormLabel><FormControl><Input type="number" step="0.1" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimensionHeight"
                    render={({ field }) => (
                      <FormItem><FormLabel>Height</FormLabel><FormControl><Input type="number" step="0.1" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormControl></FormItem>
                    )}
                  />
                </div>

                {['materials', 'features', 'performance', 'specifications'].map(key => (
                  <div key={key}>
                    <Label className="capitalize mb-2 block">{key}</Label>
                    {(form.watch(key as any) || []).map((item: string, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input value={item} onChange={e => updateArrayItem(key, index, e.target.value)} />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(key, index)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(key as any)}><Plus className="mr-2 h-4 w-4" /> Add {key.slice(0, -1)}</Button>
                  </div>
                ))}

                <FormField
                  control={form.control}
                  name="technicalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technical Description</FormLabel>
                      <FormControl>
                        <textarea className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AVAILABLE VARIANTS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['vehicleFitment', 'sizes', 'thickness', 'colors'].map(key => (
                  <div key={key}>
                    <Label className="capitalize mb-2 block">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    {(form.watch(key as any) || []).map((item: string, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input value={item} onChange={e => updateArrayItem(key, index, e.target.value)} />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(key, index)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(key as any)}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Weight and Dimensions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="weightValue" render={({ field }) => <FormItem><FormLabel>Weight</FormLabel><Input type="number" step="0.1" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormItem>} />
                  <FormField control={form.control} name="weightUnit" render={({ field }) => <FormItem><FormLabel>Unit</FormLabel><Select value={field.value || "kg"} onChange={field.onChange}><option value="kg">kg</option><option value="lb">lb</option></Select></FormItem>} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="packingWeight" render={({ field }) => <FormItem><FormLabel>Packing Weight</FormLabel><Input type="number" step="0.1" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormItem>} />
                  <FormField control={form.control} name="packingWeightUnit" render={({ field }) => <FormItem><FormLabel>Unit</FormLabel><Select value={field.value || "kg"} onChange={field.onChange}><option value="kg">kg</option><option value="lb">lb</option></Select></FormItem>} />
                </div>
                <FormField control={form.control} name="minOrderQuantity" render={({ field }) => <FormItem><FormLabel>MOQ</FormLabel><Input type="number" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormItem>} />
              </CardContent>
            </Card> */}
          </div >
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="basePrice" render={({ field }) => <FormItem><FormLabel>Base Price *</FormLabel><Input type="number" step="0.01" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} /></FormItem>} />
                <FormField control={form.control} name="currency" render={({ field }) => <FormItem><FormLabel>Currency</FormLabel>
                  <Select value={field.value || "AED"} onChange={field.onChange}>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                  </Select>
                </FormItem>} />
              </div>

              {/* Combo product Individual pricing Section */}
              <div className="border p-4 rounded-md bg-muted/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Combo product Individual pricing</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={updateBasePrice} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      <Save className="h-4 w-4 mr-2" /> Update Base Price
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addIndividualProduct}>
                      <Plus className="h-4 w-4 mr-2" /> Add product
                    </Button>
                  </div>
                </div>

                {(form.watch("individualProductPricing") || []).map((_, index) => (
                  <div key={index} className="flex gap-4 items-end mb-4 border-b pb-4 last:border-0 last:pb-0">
                    <FormField
                      control={form.control}
                      name={`individualProductPricing.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-[2]">
                          <FormLabel className="text-xs">Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter product name" />
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-10 w-10 mb-2"
                      onClick={() => removeIndividualProduct(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(form.watch("individualProductPricing") || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No individual products added.</p>
                )}
              </div>

              {/* Pricing Tiers Section */}
              <div className="border p-4 rounded-md bg-muted/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Wholesale Pricing Tiers</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingTier}>
                    <Plus className="h-4 w-4 mr-2" /> Add Tier
                  </Button>
                </div>

                {pricingTiers.map((tier, index) => (
                  <div key={index} className="flex gap-4 items-end mb-4 border-b pb-4 last:border-0 last:pb-0">
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-10 w-10 mb-2"
                      onClick={() => removePricingTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {pricingTiers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No pricing tiers added.</p>
                )}
              </div>

              {/* Shipping & Packing Charges */}
              <div className="grid gap-4 md:grid-cols-2 py-4">
                <FormField
                  control={form.control}
                  name="shippingCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Charge ({form.watch("currency")})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packingCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Charge ({form.watch("currency")})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="py-2">
                <Label>Pricing Terms</Label>
                {(form.watch('pricingTerms') || []).map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input value={item} onChange={e => updateArrayItem('pricingTerms', index, e.target.value)} />
                    <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem('pricingTerms', index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('pricingTerms')}><Plus className="mr-2 h-4 w-4" /> Add Term</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="stock" render={({ field }) => <FormItem><FormLabel>Stock</FormLabel><Input type="number" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormItem>} />
                <FormField
                  control={form.control}
                  name="productionLeadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="readyStockAvailable"
                render={({ field }) => (
                  <FormItem className="pt-2">
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
            </CardContent>
          </Card>
        );

      case 4:
        const coverPreview = coverImageFile
          ? URL.createObjectURL(coverImageFile)
          : (form.watch('image') as string);

        return (
          <Card>
            <CardHeader><CardTitle>Uploads & Media</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image Section */}
              <FormField control={form.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Cover Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div
                        className={`
                                             relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center 
                                             min-h-[250px] cursor-pointer transition-all duration-200
                                             ${coverPreview ? 'border-primary/50 bg-accent/10' : 'border-border hover:border-primary/50 hover:bg-accent/5'}
                                         `}
                        onClick={() => document.getElementById('cover-upload-input')?.click()}
                      >
                        {coverPreview ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img
                              src={coverPreview}
                              alt="Cover Preview"
                              className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm"
                            />
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
                            if (file) {
                              setCoverImageFile(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Gallery Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FormLabel className="text-base font-semibold">Gallery Images</FormLabel>
                    <span className="text-xs text-muted-foreground">{gallery.length + galleryFiles.length} images</span>
                  </div>
                  {/* Select All / Delete Controls */}
                  <div className="flex items-center gap-2">
                    {(gallery.length > 0) && (
                      <div className="flex items-center gap-2 mr-2">
                        <Checkbox
                          checked={selectedMediaIds.size > 0 && selectedMediaIds.size === (product as any)?.media?.length} // Approximation, ideally accurate count
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          id="select-all"
                        />
                        <Label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                          Select All
                        </Label>
                      </div>
                    )}

                    {selectedMediaIds.size > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected ({selectedMediaIds.size})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Existing Gallery Items */}
                  {gallery.map((item, index) => {
                    // Determine if this is an existing server image with an ID
                    const mediaItem = (product as any)?.media?.find((m: any) =>
                      m.url === item || item.endsWith(m.url) || (m.url && m.url.endsWith(item))
                    );

                    return (
                      <div key={`existing-${index}`} className="group relative aspect-square border rounded-xl overflow-hidden bg-background shadow-sm">
                        <img src={item} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                        {/* Checkbox for Bulk Delete (Only for server items) */}
                        {mediaItem && (
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={selectedMediaIds.has(mediaItem.id)}
                              onCheckedChange={() => handleToggleSelect(mediaItem.id)}
                              className="bg-white/90 border-black/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5"
                            />
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                          onClick={() => removeArrayItem('gallery', index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Existing
                        </div>
                      </div>
                    );
                  })}

                  {/* New Uploads */}
                  {galleryFiles.map((file, i) => (
                    <div key={`new-${i}`} className="group relative aspect-square border-2 border-primary/50 rounded-xl overflow-hidden bg-background shadow-sm">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                      />
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

                  {/* Add Button */}
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
                          setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                        }
                        // Reset input logic if needed
                      }}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card>
            <CardHeader><CardTitle>Declarations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="manufacturingSource" render={({ field }) => <FormItem><FormLabel>Source</FormLabel><Select value={field.value || ""} onChange={field.onChange}><option value="">Select</option><option value="In-House">In-House</option><option value="Sourced">Sourced</option></Select></FormItem>} />
              {form.watch("manufacturingSource") === "Sourced" && <FormField control={form.control} name="manufacturingSourceName" render={({ field }) => <FormItem><FormLabel>Source Name</FormLabel><Input {...field} /></FormItem>} />}

              {/* Export License, Warranty, etc checkboxes */}
              <FormField
                control={form.control}
                name="requiresExportLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requires Export License?</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")} className="flex gap-4">
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
                      <RadioGroup value={field.value ? "yes" : "no"} onValueChange={(val) => field.onChange(val === "yes")} className="flex gap-4">
                        <RadioGroupItem value="yes" label="Yes" />
                        <RadioGroupItem value="no" label="No" />
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {form.watch("hasWarranty") && (
                <>
                  <FormField control={form.control} name="warranty" render={({ field }) => <FormItem><FormLabel>Warranty Details</FormLabel><Input {...field} /></FormItem>} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="warrantyDuration" render={({ field }) => <FormItem><FormLabel>Duration</FormLabel><Input type="number" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormItem>} />
                    <FormField control={form.control} name="warrantyDurationUnit" render={({ field }) => <FormItem><FormLabel>Unit</FormLabel><Select value={field.value || "Months"} onChange={field.onChange}><option value="Months">Months</option><option value="Years">Years</option></Select></FormItem>} />
                  </div>
                </>
              )}

              <FormField control={form.control} name="supplierSignature" render={({ field }) => <FormItem><FormLabel>Supplier Signature</FormLabel><Input {...field} /></FormItem>} />
              <FormField control={form.control} name="signatureDate" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><DateSelector value={field.value} onChange={field.onChange} /></FormItem>} />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3 p-4 border rounded-md bg-muted/20">
                    <FormLabel className="text-base font-semibold">Publish Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value || "draft"}
                        className="flex flex-col space-y-1"
                        value={field.value || "draft"}
                      >
                        <RadioGroupItem
                          value="draft"
                          label="Draft (Hidden from approval)"
                        />
                        <RadioGroupItem
                          value="published"
                          label="Published (Submit for Approval)"
                          disabled={!canPublish}
                        />
                      </RadioGroup>
                    </FormControl>
                    {!canPublish && (
                      <div className="text-xs text-destructive mt-2">
                        To publish, please ensure the following are filled:
                        Name, Category, Description, Price, Quantity (Stock).
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="complianceConfirmed" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl><input type="checkbox" checked={field.value || false} onChange={field.onChange} className="h-4 w-4" /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>I confirm compliance</FormLabel></div>
                </FormItem>
              )} />

            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (productId && isLoadingProduct) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }



  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-4 pb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentProductId ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below.
          </p>
        </div>
        {currentProductId && (
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() =>
              window.open(
                `${process.env.NEXT_PUBLIC_WEBSITE_URL ||
                "http://localhost:3000"
                }/product/${currentProductId}`,
                "_blank"
              )
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (Object.keys(errors).length > 0) {
            console.error("Form Validation Errors:", errors);
          }
        })} className="space-y-8">
          {/* Custom Tab Navigation Matching Product Detail Page */}
          <div className="flex space-x-1 border-b border-border w-full overflow-x-auto">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeTab === section.id;
              const isDisabled = !currentProductId && section.id !== 1; // Disable other tabs if creating
              return (
                <button
                  key={section.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleTabChange(section.id)}
                  className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2
                        ${isActive
                      ? "border-primary text-primary"
                      : isDisabled
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}
                      `}
                >
                  <Icon className="h-4 w-4" />
                  {section.name}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {renderStepContent(activeTab)}
          </div>

          <div className="flex justify-end gap-4 items-center">
            {/* Show helper message for current step when required fields are missing */}
            {!currentProductId && !canProceed && currentStepValidation.message && (
              <p className="text-xs text-muted-foreground">
                {currentStepValidation.message}
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createProductMutation.isPending ||
                updateProductMutation.isPending ||
                (!currentProductId && !canProceed) // Disable for new products until current step's required fields are filled
              }
            >
              {createProductMutation.isPending || updateProductMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                !currentProductId ? "Save & Continue" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
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




