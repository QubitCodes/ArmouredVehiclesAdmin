"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Plus,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateVendorProduct,
  useUpdateVendorProduct,
  useVendorProduct,
} from "@/hooks/vendor/product-management/use-products";
import {
  useMainCategories,
  useCategoriesByParent,
} from "@/hooks/admin/product-management/use-categories";
import { useCountries } from "@/hooks/vendor/dashboard/use-countries";
import { vendorAuthService } from "@/services/vendor/auth.service";
import { getVendorIdFromToken } from "@/lib/jwt";
import { WEIGHT_UNITS, DIMENSION_UNITS, DIMENSION_UNITS_WITH_MM } from "@/lib/units";
import type {
  CreateProductRequest,
  UpdateProductRequest,
  Product,
} from "@/services/vendor/product.service";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "Product Code / SKU is required"),
  mainCategoryId: z
    .union([z.number().int().positive(), z.undefined()])
    .refine((val) => val !== undefined, {
      message: "Main Category is required",
    }),
  categoryId: z.number().int().positive().optional(),
  subCategoryId: z.number().int().positive().optional(),
  vehicleCompatibility: z.string().min(1, "Vehicle Compatibility is required"),
  certifications: z.string().min(1, "Certifications / Standards is required"),
  countryOfOrigin: z.string().min(1, "Country of Origin is required"),
  controlledItemType: z.string().min(1, "Controlled Item Type is required"),
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
  basePrice: z.number().min(0, "Base price must be greater than or equal to 0"),
  currency: z.string().optional(),
  stock: z.number().optional(),
  minOrderQuantity: z.number().optional(),
  condition: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  readyStockAvailable: z.boolean().optional(),
  pricingTerms: z.array(z.string()).optional(),
  tier1Price: z.number().optional(),
  tier2Price: z.number().optional(),
  tier3Price: z.number().optional(),
  selectedTier: z.string().optional(),
  productionLeadTime: z.number().optional(),
  manufacturingSource: z.string().optional(),
  manufacturingSourceName: z.string().optional(),
  duration: z.number().optional(),
  durationUnit: z.string().optional(),
  terms: z.string().optional(),
  requiresExportLicense: z.boolean().optional(),
  hasWarranty: z.boolean().optional(),
  warrantyDuration: z.number().optional(),
  warrantyDurationUnit: z.string().optional(),
  warrantyTerms: z.string().optional(),
  complianceConfirmed: z.boolean().optional(),
  supplierSignature: z.string().optional(),
  vehicleFitment: z.array(z.string()).optional(),
  specifications: z.array(z.string()).optional(),
  description: z.string().optional(),
  warranty: z.string().optional(),
  actionType: z.string().optional(),
  isFeatured: z.boolean().optional(),
  image: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  gallery: z.array(z.string().url()).optional(),
  signatureDate: z
    .object({
      day: z.number().optional(),
      month: z.number().optional(),
      year: z.number().optional(),
    })
    .optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const SECTIONS = [
  {
    id: 1,
    name: "Basic Information",
    fields: [
      "name",
      "sku",
      "mainCategoryId",
      "categoryId",
      "subCategoryId",
      "certifications",
      "controlledItemType",
      "vehicleCompatibility",
      "make",
      "model",
      "year",
      "countryOfOrigin",
      "description",
    ],
  },
  {
    id: 2,
    name: "Technical Description",
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
      "driveTypes",
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
    fields: [
      "basePrice",
      "currency",
      "pricingTerms",
      "productionLeadTime",
      "readyStockAvailable",
      "stock",
      "condition",
    ],
  },
  {
    id: 4,
    name: "Uploads & Media",
    fields: ["image", "gallery"],
  },
  {
    id: 5,
    name: "Declarations",
    fields: [
      "manufacturingSource",
      "manufacturingSourceName",
      "duration",
      "durationUnit",
      "terms",
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

export default function NewProductPage() {
  const router = useRouter();
  const createProductMutation = useCreateVendorProduct();
  const updateProductMutation = useUpdateVendorProduct();
  const [currentStep, setCurrentStep] = useState(1);
  const [productId, setProductId] = useState<string | null>(null);
  const { data: mainCategories = [] } = useMainCategories();
  const { data: countries = [], isLoading: isLoadingCountries } =
    useCountries();
  
  // Fetch product data when productId exists (for populating form when navigating back)
  const { data: productData } = useVendorProduct(productId);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      basePrice: 0,
      currency: "USD",
      condition: "new",
      dimensionUnit: "mm",
      weightUnit: "kg",
      packingDimensionUnit: "cm",
      packingWeightUnit: "kg",
      warrantyDurationUnit: "months",
      durationUnit: "Months",
      readyStockAvailable: false,
      requiresExportLicense: false,
      hasWarranty: false,
      complianceConfirmed: false,
      isFeatured: false,
      actionType: "buy_now",
      materials: [""],
      features: [""],
      performance: [""],
      specifications: [],
      driveTypes: [],
      sizes: [],
      thickness: [],
      colors: [],
      vehicleFitment: [],
      pricingTerms: [],
      gallery: [],
      signatureDate: undefined,
      tier1Price: undefined,
      tier2Price: undefined,
      tier3Price: undefined,
      selectedTier: undefined,
    },
  });

  // Watch mainCategoryId to fetch categories when it changes
  const mainCategoryId = form.watch("mainCategoryId");
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategoriesByParent(mainCategoryId);

  // Watch categoryId to fetch subcategories when it changes
  const categoryId = form.watch("categoryId");
  const { data: subCategories = [], isLoading: isLoadingSubCategories } =
    useCategoriesByParent(categoryId);

  const materials = form.watch("materials") || [];
  const features = form.watch("features") || [];
  const performance = form.watch("performance") || [];
  const driveTypes = form.watch("driveTypes") || [];
  const sizes = form.watch("sizes") || [];
  const thickness = form.watch("thickness") || [];
  const colors = form.watch("colors") || [];
  const vehicleFitment = form.watch("vehicleFitment") || [];
  const pricingTerms = form.watch("pricingTerms") || [];
  const gallery = form.watch("gallery") || [];

  // Populate form when product data is fetched (for navigating back)
  useEffect(() => {
    if (productData && productId) {
      // Type assertion since API response may have more fields than Product type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = productData as any;
      
      // Map product data to form values
      const formValues: Partial<ProductFormValues> = {
        name: (data.name as string) || "",
        sku: (data.sku as string) || "",
        mainCategoryId: (data.mainCategoryId as number) || undefined,
        categoryId: (data.categoryId as number) || undefined,
        subCategoryId: (data.subCategoryId as number) || undefined,
        vehicleCompatibility: (data.vehicleCompatibility as string) || "",
        certifications: (data.certifications as string) || "",
        countryOfOrigin: (data.countryOfOrigin as string) || "",
        controlledItemType: (data.controlledItemType as string) || "",
        dimensionLength: data.dimensionLength != null ? (typeof data.dimensionLength === 'string' ? parseFloat(data.dimensionLength) : Number(data.dimensionLength)) : undefined,
        dimensionWidth: data.dimensionWidth != null ? (typeof data.dimensionWidth === 'string' ? parseFloat(data.dimensionWidth) : Number(data.dimensionWidth)) : undefined,
        dimensionHeight: data.dimensionHeight != null ? (typeof data.dimensionHeight === 'string' ? parseFloat(data.dimensionHeight) : Number(data.dimensionHeight)) : undefined,
        dimensionUnit: (data.dimensionUnit as string) || "mm",
        materials: Array.isArray(data.materials) && data.materials.length > 0 
          ? (data.materials as string[]) 
          : [""],
        features: Array.isArray(data.features) && data.features.length > 0 
          ? (data.features as string[]) 
          : [""],
        performance: Array.isArray(data.performance) && data.performance.length > 0 
          ? (data.performance as string[]) 
          : [""],
        technicalDescription: (data.technicalDescription as string) || "",
        driveTypes: (data.driveTypes as string[]) || [],
        sizes: (data.sizes as string[]) || [],
        thickness: (data.thickness as string[]) || [],
        colors: (data.colors as string[]) || [],
        weightValue: data.weightValue != null ? (typeof data.weightValue === 'string' ? parseFloat(data.weightValue) : Number(data.weightValue)) : undefined,
        weightUnit: (data.weightUnit as string) || "kg",
        packingLength: data.packingLength != null ? (typeof data.packingLength === 'string' ? parseFloat(data.packingLength) : Number(data.packingLength)) : undefined,
        packingWidth: data.packingWidth != null ? (typeof data.packingWidth === 'string' ? parseFloat(data.packingWidth) : Number(data.packingWidth)) : undefined,
        packingHeight: data.packingHeight != null ? (typeof data.packingHeight === 'string' ? parseFloat(data.packingHeight) : Number(data.packingHeight)) : undefined,
        packingDimensionUnit: (data.packingDimensionUnit as string) || "cm",
        packingWeight: data.packingWeight != null ? (typeof data.packingWeight === 'string' ? parseFloat(data.packingWeight) : Number(data.packingWeight)) : undefined,
        packingWeightUnit: (data.packingWeightUnit as string) || "kg",
        basePrice: data.basePrice != null ? (typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : Number(data.basePrice)) : 0,
        currency: (data.currency as string) || "USD",
        stock: data.stock != null ? (typeof data.stock === 'string' ? parseFloat(data.stock) : Number(data.stock)) : undefined,
        minOrderQuantity: data.minOrderQuantity != null ? (typeof data.minOrderQuantity === 'string' ? parseFloat(data.minOrderQuantity) : Number(data.minOrderQuantity)) : undefined,
        condition: (data.condition as string) || "new",
        make: (data.make as string) || "",
        model: (data.model as string) || "",
        year: data.year != null ? (typeof data.year === 'string' ? parseFloat(data.year) : Number(data.year)) : undefined,
        readyStockAvailable: (data.readyStockAvailable as boolean) || false,
        pricingTerms: (data.pricingTerms as string[]) || [],
        productionLeadTime: data.productionLeadTime != null ? (typeof data.productionLeadTime === 'string' ? parseFloat(data.productionLeadTime) : Number(data.productionLeadTime)) : undefined,
        manufacturingSource: (data.manufacturingSource as string) || "",
        manufacturingSourceName: (data.manufacturingSourceName as string) || "",
        requiresExportLicense: (data.requiresExportLicense as boolean) || false,
        hasWarranty: (data.hasWarranty as boolean) || false,
        warrantyDuration: data.warrantyDuration != null ? (typeof data.warrantyDuration === 'string' ? parseFloat(data.warrantyDuration) : Number(data.warrantyDuration)) : undefined,
        warrantyDurationUnit: (data.warrantyDurationUnit as string) || "months",
        warrantyTerms: (data.warrantyTerms as string) || "",
        complianceConfirmed: (data.complianceConfirmed as boolean) || false,
        supplierSignature: (data.supplierSignature as string) || "",
        vehicleFitment: (data.vehicleFitment as string[]) || [],
        specifications: (data.specifications as string[]) || [],
        description: (data.description as string) || "",
        warranty: (data.warranty as string) || "",
        actionType: (data.actionType as string) || "buy_now",
        isFeatured: (data.isFeatured as boolean) || false,
        image: (data.imageUrl as string) || "",
        gallery: (data.gallery as string[]) || [],
      };

      // Set form values
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof ProductFormValues, value as never);
        }
      });
    }
  }, [productData, productId, form]);

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
  ) => {
    const current = form.getValues(fieldName) || [];
    form.setValue(fieldName, [...current, ""]);
  };

  const removeArrayItem = (
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
      | "gallery",
    index: number
  ) => {
    const current = form.getValues(fieldName) || [];
    form.setValue(
      fieldName,
      current.filter((_, i: number) => i !== index)
    );
  };

  const updateArrayItem = (
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
      | "gallery",
    index: number,
    value: string
  ) => {
    const current = form.getValues(fieldName) || [];
    const updated = [...current];
    updated[index] = value;
    form.setValue(fieldName, updated);
  };

  const validateCurrentStep = async () => {
    const currentSection = SECTIONS[currentStep - 1];
    const fieldsToValidate = currentSection.fields.filter((field) => {
      // Validate all required fields per step
      if (currentStep === 1) {
        // Required fields in step 1
        return [
          "name",
          "sku",
          "mainCategoryId",
          "vehicleCompatibility",
          "certifications",
          "countryOfOrigin",
          "controlledItemType",
        ].includes(field);
      }
      return true;
    });

    const isValid = await form.trigger(
      fieldsToValidate as (keyof ProductFormValues)[]
    );
    return isValid;
  };

  const cleanDataForApi = (
    data: ProductFormValues,
    fields: string[]
  ): Record<string, unknown> => {
    const cleanedData: Record<string, unknown> = {};

    fields.forEach((field) => {
      const value = data[field as keyof ProductFormValues];

      if (field === "signatureDate") {
        // Handle signatureDate object specially
        if (value && typeof value === "object") {
          const dateValue = value as {
            day?: number;
            month?: number;
            year?: number;
          };
          if (dateValue.day || dateValue.month || dateValue.year) {
            cleanedData[field] = value;
          }
        }
      } else if (Array.isArray(value)) {
        const filtered = value.filter((item) => item !== "");
        if (filtered.length > 0) {
          cleanedData[field] = filtered;
        }
      } else if (value !== "" && value !== undefined && value !== null) {
        cleanedData[field] = value;
      }
    });

    return cleanedData;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    const currentSection = SECTIONS[currentStep - 1];
    const formData = form.getValues();

    try {
      if (currentStep === 1) {
        // Step 1: POST basic information
        const basicInfoData = cleanDataForApi(formData, currentSection.fields);
        
        // Get vendor ID from token
        const token = vendorAuthService.getToken();
        const vendorId = getVendorIdFromToken(token);
        
        if (!vendorId) {
          toast.error("Unable to get vendor ID. Please log in again.");
          return;
        }

        // Add vendorId to the request body
        const requestData: CreateProductRequest = {
          ...basicInfoData,
          vendorId,
        } as CreateProductRequest;

        const response = await createProductMutation.mutateAsync(requestData);

        // Extract product ID from response (could be response.id or response.data.id)
        const productResponse = response as
          | Product
          | { data?: Product; id?: string };
        const newProductId =
          (productResponse as Product).id ||
          (productResponse as { data?: Product }).data?.id ||
          (productResponse as { id?: string }).id;

        if (newProductId) {
          setProductId(String(newProductId));
          toast.success("Product created successfully!");
          setCurrentStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          throw new Error("Product ID not found in response");
        }
      } else {
        // Steps 2-5: PATCH update
        if (!productId) {
          toast.error("Product ID is missing. Please start from step 1.");
          return;
        }

        const updateData = cleanDataForApi(formData, currentSection.fields);

        await updateProductMutation.mutateAsync({
          id: productId,
          data: updateData as UpdateProductRequest,
        });

        toast.success("Product updated successfully!");

        if (currentStep < SECTIONS.length) {
          setCurrentStep(currentStep + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Last step completed, redirect to products list
          router.push("/vendor/products");
        }
      }
    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      let errorMessage =
        currentStep === 1
          ? "Failed to create product. Please try again."
          : "Failed to update product. Please try again.";

      if (axiosError?.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError?.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      }

      toast.error(errorMessage);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
                      <FormLabel>Select Main Category *</FormLabel>
                      <FormControl className="bg-bg-medium">
                        <Select
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const numVal =
                              val === "" ? undefined : parseInt(val);
                            field.onChange(numVal);
                            // Reset category and subcategory when main category changes
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
                      <FormControl className="bg-bg-medium">
                        <Select
                          value={field.value?.toString() || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                            // Reset subcategory when category changes
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
                      <FormControl className="bg-bg-medium">
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code / SKU *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Supplier internal code or standard"
                          {...field}
                        />
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
                      <FormLabel>Vehicle Compatibility *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Land Cruiser 76, Ford F550, Unimog, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications / Standards *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., CEN BR6, STANAG 4569, MIL-STD, DOT, ISO"
                          {...field}
                        />
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
                      <FormLabel>Country of Origin *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={countries.map((country) => ({
                            value: country.label, // Use full country name as value
                            label: country.label,
                            flag: country.flag,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select Country"
                          disabled={isLoadingCountries}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="controlledItemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold py-3">
                      Do you have any Controlled Item? *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        name="controlledItemType"
                      >
                        <RadioGroupItem
                          value="Authority-license"
                          label="Authority License"
                          className="border-none outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <RadioGroupItem
                          value="Dual-use item"
                          label="Dual-use item"
                          className="border-none outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <RadioGroupItem
                          value="ITAR-regulated"
                          label="ITAR-regulated"
                          className="border-none outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <RadioGroupItem
                          value="DG (Dangerous Goods)"
                          label="DG (Dangerous Goods)"
                          className="border-none outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <RadioGroupItem
                          value="Not Controlled"
                          label="Not Controlled"
                          className="border-none outline-none focus:ring-0 focus:ring-offset-0"
                        />
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <div className="grid pt-3 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
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
                        <Input placeholder="Land Cruiser" {...field} />
                      </FormControl>
                      <FormMessage />
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
                          placeholder="2024"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="pt-6">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                        placeholder="General product description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Technical Specifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">TECHNICAL SPECIFICATIONS:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dimensions Section */}
                <div>
                  <FormLabel className="mb-2 block">Dimensions (L × W × H)</FormLabel>
                  <div className="grid gap-2 grid-cols-4">
                    <FormField
                      control={form.control}
                      name="dimensionLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Length"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseFloat(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-bg-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensionWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Width</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Width"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseFloat(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-bg-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensionHeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Height</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Height"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseFloat(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-bg-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensionUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Unit</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || "mm"}
                              onChange={field.onChange}
                              placeholder="Unit"
                              className="bg-bg-medium"
                            >
                              {DIMENSION_UNITS_WITH_MM.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Top Row: Three Dropdowns */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Materials */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("materials");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Materials"
                      className="bg-bg-medium"
                    >
                      {materials.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Material</option>
                    </Select>
                    {materials.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {materials.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("materials", index, e.target.value)
                              }
                              placeholder="Hardened Steel"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("materials", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {materials.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("materials")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Material
                      </Button>
                    )}
                  </div>

                  {/* Features */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("features");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Features"
                      className="bg-bg-medium"
                    >
                      {features.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Feature</option>
                    </Select>
                    {features.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {features.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("features", index, e.target.value)
                              }
                              placeholder="Blast Resistant"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("features", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {features.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("features")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Feature
                      </Button>
                    )}
                  </div>

                  {/* Performance */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("performance");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Performance"
                      className="bg-bg-medium"
                    >
                      {performance.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Performance</option>
                    </Select>
                    {performance.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {performance.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("performance", index, e.target.value)
                              }
                              placeholder="Stops 7.62x51mm NATO"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("performance", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {performance.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("performance")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Performance
                      </Button>
                    )}
                  </div>
                </div>

                {/* Technical Description */}
                <FormField
                  control={form.control}
                  name="technicalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Technical Specifications (Description)
                      </FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full min-h-[100px] px-3 py-2 text-sm bg-bg-medium border border-input rounded-md"
                          placeholder="Enter dimensions, materials, features, performance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Available Variants Section */}
            <Card className="py-6">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading">AVAILABLE VARIANTS:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-0">
                {/* Top Row: Four Dropdowns */}
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Left / Right-hand drive */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("driveTypes");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Left / Right-hand drive,"
                      className="bg-bg-medium"
                    >
                      {driveTypes.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Drive Type</option>
                    </Select>
                    {driveTypes.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {driveTypes.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("driveTypes", index, e.target.value)
                              }
                              placeholder="Left / Right-hand drive,"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("driveTypes", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {driveTypes.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("driveTypes")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Drive Type
                      </Button>
                    )}
                  </div>

                  {/* Sizes */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("sizes");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Sizes"
                      className="bg-bg-medium"
                    >
                      {sizes.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Size</option>
                    </Select>
                    {sizes.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {sizes.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("sizes", index, e.target.value)
                              }
                              placeholder="Standard"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("sizes", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {sizes.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("sizes")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Size
                      </Button>
                    )}
                  </div>

                  {/* Thickness */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("thickness");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Thickness"
                      className="bg-bg-medium"
                    >
                      {thickness.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Thickness</option>
                    </Select>
                    {thickness.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {thickness.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("thickness", index, e.target.value)
                              }
                              placeholder="25mm"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("thickness", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {thickness.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("thickness")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Thickness
                      </Button>
                    )}
                  </div>

                  {/* Color Options */}
                  <div>
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__add_new__") {
                          addArrayItem("colors");
                          e.target.value = "";
                        }
                      }}
                      placeholder="Color Options"
                      className="bg-bg-medium"
                    >
                      {colors.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add Color</option>
                    </Select>
                    {colors.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {colors.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) =>
                                updateArrayItem("colors", index, e.target.value)
                              }
                              placeholder="Black"
                              className="bg-bg-medium"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeArrayItem("colors", index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {colors.length === 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-muted-foreground"
                        onClick={() => addArrayItem("colors")}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Color
                      </Button>
                    )}
                  </div>
                </div>

                {/* Two Column Layout: Weight and Dimensions */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="mb-2 block">Weight (per unit)</FormLabel>
                      <div className="grid gap-2 grid-cols-2">
                        <FormField
                          control={form.control}
                          name="weightValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Weight Value</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Eg. 1.2"
                                  value={field.value != null ? String(field.value) : ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : (isNaN(parseFloat(val)) ? undefined : parseFloat(val))
                                    );
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="bg-bg-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weightUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Unit</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value || "kg"}
                                  onChange={field.onChange}
                                  placeholder="Unit"
                                  className="bg-bg-medium"
                                >
                                  {WEIGHT_UNITS.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <FormLabel className="mb-2 block">Packing Weight (gross)</FormLabel>
                      <div className="grid gap-2 grid-cols-2">
                        <FormField
                          control={form.control}
                          name="packingWeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Packing Weight Value</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Eg. 1.2"
                                  value={field.value != null ? String(field.value) : ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : (isNaN(parseFloat(val)) ? undefined : parseFloat(val))
                                    );
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="bg-bg-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="packingWeightUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Unit</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value || "kg"}
                                  onChange={field.onChange}
                                  placeholder="Unit"
                                  className="bg-bg-medium"
                                >
                                  {WEIGHT_UNITS.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="mb-2 block">
                        Packing Dimensions (L × W × H)
                      </FormLabel>
                      <div className="grid gap-2 grid-cols-4">
                        <FormField
                          control={form.control}
                          name="packingLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Length</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Length"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : parseFloat(val)
                                    );
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="bg-bg-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="packingWidth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Width</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Width"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : parseFloat(val)
                                    );
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="bg-bg-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="packingHeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Height</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Height"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : parseFloat(val)
                                    );
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  className="bg-bg-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="packingDimensionUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Unit</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value || "inches"}
                                  onChange={field.onChange}
                                  placeholder="Unit"
                                  className="bg-bg-medium"
                                >
                                  {DIMENSION_UNITS.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </option>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="minOrderQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Order Quantity (MOQ)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Eg. 50 units"
                              value={field.value != null ? String(field.value) : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : (isNaN(parseInt(val)) ? undefined : parseInt(val))
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-bg-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-4 block">
                  Base Unit Price (USD or AED):
                </Label>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <FormField
                      control={form.control}
                      name="basePrice"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="125.00"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseFloat(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem className="w-full sm:w-[120px]">
                          <FormControl>
                            <Select
                              value={field.value || "USD"}
                              onChange={field.onChange}
                              placeholder="Select Currency"
                            >
                              <option value="USD">USD</option>
                              <option value="AED">AED</option>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4 md:gap-6 md:ml-4 flex-wrap">
                    {["EXW", "FOB", "CIF"].map((term) => (
                      <div key={term} className="flex items-center gap-2">
                        <Checkbox
                          id={`pricingTerm-${term}`}
                          checked={pricingTerms.includes(term)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("pricingTerms") || [];
                            if (checked) {
                              form.setValue("pricingTerms", [...current, term]);
                            } else {
                              form.setValue(
                                "pricingTerms",
                                current.filter((t) => t !== term)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`pricingTerm-${term}`}
                          className="cursor-pointer font-normal"
                        >
                          {term}
                        </Label>
                        <div className="h-5 w-5 rounded-full bg-[#16a34a] flex items-center justify-center">
                          <Info className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="py-6">
                <Label className="mb-4 block">
                  Tiered Pricing Options (if any):
                </Label>
                <div className="grid gap-4 md:grid-cols-3">
                  {(() => {
                    const selectedTier = form.watch("selectedTier");
                    return [
                      { range: "1-10 units", tier: "1", field: "tier1Price" },
                      { range: "11-50 units", tier: "2", field: "tier2Price" },
                      { range: "50+ units", tier: "3", field: "tier3Price" },
                    ].map(({ range, tier, field }) => (
                      <div key={tier} className="flex items-center gap-3">
                        <input
                          type="radio"
                          id={`tier-${tier}`}
                          name="selectedTier"
                          value={tier}
                          checked={selectedTier === tier}
                          onChange={(e) => {
                            form.setValue("selectedTier", e.target.value);
                          }}
                          className="h-4 w-4 border-input text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2 cursor-pointer"
                        />
                        <Label
                          htmlFor={`tier-${tier}`}
                          className="cursor-pointer font-normal whitespace-nowrap"
                        >
                          {range}
                        </Label>
                        <FormField
                          control={form.control}
                          name={field as "tier1Price" | "tier2Price" | "tier3Price"}
                          render={({ field: priceField }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="$0.00"
                                  value={priceField.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    priceField.onChange(
                                      val === "" ? undefined : parseFloat(val)
                                    );
                                  }}
                                  onBlur={priceField.onBlur}
                                  name={priceField.name}
                                  ref={priceField.ref}
                                  className="flex-1"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <FormField
                control={form.control}
                name="productionLeadTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Lead Time (in days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter days required to produce one order"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(
                            val === "" ? undefined : parseInt(val)
                          );
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="readyStockAvailable"
                  render={({ field }) => (
                    <FormItem className="pt-6 pb-3">
                      <FormLabel>Ready Stock Available?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={
                            field.value === true
                              ? "yes"
                              : field.value === false
                              ? "no"
                              : ""
                          }
                          onValueChange={(val) => field.onChange(val === "yes")}
                          name="readyStockAvailable"
                          className="flex-row gap-6"
                        >
                          <RadioGroupItem value="yes" label="Yes" />
                          <RadioGroupItem value="no" label="No" />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem className="pt-6">
                      <FormLabel>Stock quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseInt(val)
                            );
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                {/* <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || "new"}
                          onChange={field.onChange}
                          placeholder="Select Condition"
                        >
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Uploads & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image URL (Cover Photo)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://cdn.armoredmart.com/products/main.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="mb-2 block">Gallery Images (URLs)</Label>
                {gallery.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      type="url"
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("gallery", index, e.target.value)
                      }
                      placeholder="https://cdn.armoredmart.com/products/detail-1.jpg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("gallery", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("gallery")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Gallery Image
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">COMPLIANCE & DECLARATIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 pb-6">
                <FormField
                  control={form.control}
                  name="manufacturingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Is this product manufactured in-house or sourced?
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select"
                        >
                          <option value="In-House">In-House</option>
                          <option value="Sourced">Sourced</option>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingSourceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name of Manufacturing Source (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Blueweb Auto Industries LLC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requiresExportLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Does this product require pre-approval or export license?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={
                          field.value === true
                            ? "yes"
                            : field.value === false
                            ? "no"
                            : ""
                        }
                        onValueChange={(val) => field.onChange(val === "yes")}
                        name="requiresExportLicense"
                        className="flex-row gap-6"
                      >
                        <RadioGroupItem value="yes" label="Yes" />
                        <RadioGroupItem value="no" label="No" />
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hasWarranty"
                  render={({ field }) => (
                    <FormItem className="pt-6 pb-3">
                      <FormLabel>Does this product carry warranty?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={
                            field.value === true
                              ? "yes"
                              : field.value === false
                              ? "no"
                              : ""
                          }
                          onValueChange={(val) => field.onChange(val === "yes")}
                          name="hasWarranty"
                          className="flex-row gap-6"
                        >
                          <RadioGroupItem value="yes" label="Yes" />
                          <RadioGroupItem value="no" label="No" />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2 pt-6">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === "" ? undefined : parseInt(val)
                              );
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "Months"}
                            onChange={field.onChange}
                            placeholder="Unit"
                          >
                            <option value="Months">Months</option>
                            <option value="Years">Years</option>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                        placeholder="Terms"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                        <FormLabel>Warranty</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 5 years against armor failure, 1 year hardware"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="warrantyDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="12"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? undefined : parseInt(val)
                                );
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
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
                            <Select
                              value={field.value || "Months"}
                              onChange={field.onChange}
                              placeholder="Unit"
                            >
                              <option value="Months">Months</option>
                              <option value="Years">Years</option>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="warrantyTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                            placeholder="Terms"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="complianceConfirmed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0 pt-6 pb-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm that the above product listing is truthful,
                        compliant with all relevant laws, and does not breach
                        any export or import controls.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full">
        <div className="flex items-center gap-2 overflow-x-auto">
          {SECTIONS.map((section, index) => (
            <div key={section.id} className="flex items-center shrink-0">
              <div
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  currentStep === section.id
                    ? "bg-card text-secondary"
                    : currentStep > section.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => {
                  // Allow clicking on completed or current sections
                  if (currentStep >= section.id) {
                    setCurrentStep(section.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                {section.name}
              </div>
              {index < SECTIONS.length - 1 && (
                <div
                  className={`w-2 h-2 mx-2 ${
                    currentStep > section.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            // Prevent form submission when Enter is pressed in any input field
            // This prevents auto-submit even on the last section
            if (
              e.key === "Enter" &&
              (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement)
            ) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="space-y-6"
        >
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              className={currentStep === section.id ? "block" : "hidden"}
            >
              {renderStepContent(section.id)}
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className={`flex justify-between gap-4 pt-4 ${currentStep === 2 ? "mb-0" : ""}`}>
            <Button
              type="button"
              variant="secondary"
              className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[200px] h-[48px]"
              onClick={() => router.back()}
              disabled={createProductMutation.isPending}
            >
              Cancel
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                className="bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[200px] h-[48px]"
                onClick={handlePrevious}
                disabled={
                  currentStep === 1 ||
                  createProductMutation.isPending
                }
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < SECTIONS.length ? (
                <Button
                  type="button"
                  variant="default"
                  className="bg-secondary text-white hover:bg-secondary/90 font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[200px] h-[48px]"
                  onClick={handleNext}
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="bg-secondary text-white hover:bg-secondary/90 font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                  onClick={handleNext}
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "SUBMIT PRODUCT"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
