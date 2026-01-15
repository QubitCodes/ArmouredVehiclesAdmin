"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { useCreateProduct } from "@/hooks/admin/product-management/use-products";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  mainCategoryId: z.number().optional(),
  categoryId: z.number().optional(),
  subCategoryId: z.number().optional(),
  vehicleCompatibility: z.string().optional(),
  certifications: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  controlledItemType: z.string().optional(),
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
  productionLeadTime: z.number().optional(),
  manufacturingSource: z.string().optional(),
  manufacturingSourceName: z.string().optional(),
  requiresExportLicense: z.boolean().optional(),
  hasWarranty: z.boolean().optional(),
  warrantyDuration: z.number().optional(),
  warrantyDurationUnit: z.string().optional(),
  warrantyTerms: z.string().optional(),
  complianceConfirmed: z.boolean().optional(),
  supplierSignature: z.string().optional(),
  vehicleFitment: z.string().optional(),
  specifications: z.string().optional(),
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
});

type ProductFormValues = z.infer<typeof productSchema>;

const SECTIONS = [
  {
    id: 1,
    name: "Basic Information",
    fields: ["name", "sku", "basePrice", "description"],
  },
  {
    id: 2,
    name: "Categories & Vehicle",
    fields: [
      "mainCategoryId",
      "categoryId",
      "subCategoryId",
      "make",
      "model",
      "year",
      "vehicleCompatibility",
    ],
  },
  {
    id: 3,
    name: "Specifications",
    fields: [
      "certifications",
      "countryOfOrigin",
      "controlledItemType",
      "specifications",
      "vehicleFitment",
    ],
  },
  {
    id: 4,
    name: "Dimensions",
    fields: [
      "dimensionLength",
      "dimensionWidth",
      "dimensionHeight",
      "dimensionUnit",
      "weightValue",
      "weightUnit",
    ],
  },
  {
    id: 5,
    name: "Packing",
    fields: [
      "packingLength",
      "packingWidth",
      "packingHeight",
      "packingDimensionUnit",
      "packingWeight",
      "packingWeightUnit",
    ],
  },
  {
    id: 6,
    name: "Materials & Features",
    fields: [
      "materials",
      "features",
      "performance",
      "driveTypes",
      "sizes",
      "thickness",
      "colors",
      "technicalDescription",
    ],
  },
  {
    id: 7,
    name: "Stock & Pricing",
    fields: [
      "stock",
      "minOrderQuantity",
      "currency",
      "condition",
      "productionLeadTime",
      "actionType",
      "readyStockAvailable",
      "isFeatured",
      "pricingTerms",
    ],
  },
  {
    id: 8,
    name: "Manufacturing",
    fields: [
      "manufacturingSource",
      "manufacturingSourceName",
      "requiresExportLicense",
      "complianceConfirmed",
      "supplierSignature",
    ],
  },
  {
    id: 9,
    name: "Warranty",
    fields: [
      "hasWarranty",
      "warrantyDuration",
      "warrantyDurationUnit",
      "warrantyTerms",
      "warranty",
    ],
  },
  { id: 10, name: "Images", fields: ["image", "gallery"] },
];

export default function NewProductPage() {
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      basePrice: 0,
      currency: "USD",
      condition: "new",
      dimensionUnit: "cm",
      weightUnit: "kg",
      packingDimensionUnit: "cm",
      packingWeightUnit: "kg",
      warrantyDurationUnit: "months",
      readyStockAvailable: false,
      requiresExportLicense: false,
      hasWarranty: false,
      complianceConfirmed: false,
      isFeatured: false,
      actionType: "buy_now",
      materials: [],
      features: [],
      performance: [],
      driveTypes: [],
      sizes: [],
      thickness: [],
      colors: [],
      pricingTerms: [],
      gallery: [],
    },
  });

  const materials = form.watch("materials") || [];
  const features = form.watch("features") || [];
  const performance = form.watch("performance") || [];
  const driveTypes = form.watch("driveTypes") || [];
  const sizes = form.watch("sizes") || [];
  const thickness = form.watch("thickness") || [];
  const colors = form.watch("colors") || [];
  const pricingTerms = form.watch("pricingTerms") || [];
  const gallery = form.watch("gallery") || [];

  const addArrayItem = (
    fieldName:
      | "materials"
      | "features"
      | "performance"
      | "driveTypes"
      | "sizes"
      | "thickness"
      | "colors"
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
      | "driveTypes"
      | "sizes"
      | "thickness"
      | "colors"
      | "pricingTerms"
      | "gallery",
    index: number
  ) => {
    const current = form.getValues(fieldName) || [];
    form.setValue(
      fieldName,
      current.filter((_: any, i: number) => i !== index)
    );
  };

  const updateArrayItem = (
    fieldName:
      | "materials"
      | "features"
      | "performance"
      | "driveTypes"
      | "sizes"
      | "thickness"
      | "colors"
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
      // Only validate required fields in step 1
      if (currentStep === 1) {
        return field === "name" || field === "basePrice";
      }
      return true;
    });

    const isValid = await form.trigger(fieldsToValidate as any);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < SECTIONS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Clean up empty arrays and undefined values
      const cleanedData: any = {};
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const filtered = value.filter((item) => item !== "");
          if (filtered.length > 0) {
            cleanedData[key] = filtered;
          }
        } else if (value !== "" && value !== undefined && value !== null) {
          cleanedData[key] = value;
        }
      });

      // Console preview of the data

      await createProductMutation.mutateAsync(cleanedData);
      toast.success("Product created successfully!");
      router.push("/admin/products/admin");
    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      let errorMessage = "Failed to create product. Please try again.";
      if (axiosError?.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError?.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      }

      toast.error(errorMessage);
    }
  };

  const renderStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return (
          <Card>
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
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="ADP-L4-2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="4599.99"
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                        placeholder="Premium armored door panel for military and VIP vehicles"
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
          <Card>
            <CardHeader>
              <CardTitle>Categories & Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="mainCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Category ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
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
                  name="subCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub Category ID</FormLabel>
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
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                        <Input
                          placeholder="Land Cruiser"
                          value={field.value ?? ""}
                          onChange={field.onChange}
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
              </div>

              <FormField
                control={form.control}
                name="vehicleCompatibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Compatibility</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Land Cruiser 200 Series (2008-2021)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleFitment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Fitment</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Front left door, armored variant"
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

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Specifications & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="NIJ Level IV, VPAM BRV 2009"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifications</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="STANAG Level 2, multi-hit protection, blast-resistant hinges"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="controlledItemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Controlled Item Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Ballistic Protection" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="dimensionLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="120.5"
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
                  name="dimensionWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="80.3"
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
                  name="dimensionHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5.2"
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
                  name="dimensionUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="weightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="45.5"
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
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Packing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="packingLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="130"
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
                  name="packingWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Width</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="90"
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
                  name="packingHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Height</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
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
                  name="packingDimensionUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimension Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="packingWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
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
                  name="packingWeightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packing Weight Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Materials, Features & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="technicalDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                        placeholder="Advanced composite armor door panel designed for high-threat environments..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Materials */}
              <div>
                <Label className="mb-2 block">Materials</Label>
                {materials.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("materials", index, e.target.value)
                      }
                      placeholder="Hardened Steel"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("materials")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </div>

              {/* Features */}
              <div>
                <Label className="mb-2 block">Features</Label>
                {features.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("features", index, e.target.value)
                      }
                      placeholder="Blast Resistant"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("features")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Feature
                </Button>
              </div>

              {/* Performance */}
              <div>
                <Label className="mb-2 block">Performance</Label>
                {performance.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("performance", index, e.target.value)
                      }
                      placeholder="Stops 7.62x51mm NATO"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("performance")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Performance
                </Button>
              </div>

              {/* Drive Types */}
              <div>
                <Label className="mb-2 block">Drive Types</Label>
                {driveTypes.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("driveTypes", index, e.target.value)
                      }
                      placeholder="4WD"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("driveTypes")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Drive Type
                </Button>
              </div>

              {/* Sizes */}
              <div>
                <Label className="mb-2 block">Sizes</Label>
                {sizes.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("sizes", index, e.target.value)
                      }
                      placeholder="Standard"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("sizes")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Size
                </Button>
              </div>

              {/* Thickness */}
              <div>
                <Label className="mb-2 block">Thickness</Label>
                {thickness.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("thickness", index, e.target.value)
                      }
                      placeholder="25mm"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("thickness")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Thickness
                </Button>
              </div>

              {/* Colors */}
              <div>
                <Label className="mb-2 block">Colors</Label>
                {colors.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("colors", index, e.target.value)
                      }
                      placeholder="Black"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("colors")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Color
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Stock & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
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

                <FormField
                  control={form.control}
                  name="minOrderQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Order Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2"
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <Input placeholder="new" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productionLeadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Lead Time (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="45"
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
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Type</FormLabel>
                      <FormControl>
                        <Input placeholder="buy_now" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <FormField
                  control={form.control}
                  name="readyStockAvailable"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Ready Stock Available
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Is Featured</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing Terms */}
              <div>
                <Label className="mb-2 block">Pricing Terms</Label>
                {pricingTerms.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("pricingTerms", index, e.target.value)
                      }
                      placeholder="FOB"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem("pricingTerms", index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("pricingTerms")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pricing Term
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturing Source</FormLabel>
                      <FormControl>
                        <Input placeholder="OEM" {...field} />
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
                      <FormLabel>Manufacturing Source Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ArmorTech Industries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <FormField
                  control={form.control}
                  name="requiresExportLicense"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Requires Export License
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complianceConfirmed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Compliance Confirmed
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplierSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Signature</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe - 2024-12-23" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 9:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Warranty Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasWarranty"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Has Warranty</FormLabel>
                  </FormItem>
                )}
              />

              {form.watch("hasWarranty") && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="warrantyDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty Duration</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="24"
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
                          <FormLabel>Duration Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="months" {...field} />
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
                        <FormLabel>Warranty Terms</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border"
                            placeholder="Full coverage against manufacturing defects. Installation warranty separate."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty (Alternative)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="5 years against armor failure, 1 year hardware"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>
        );

      case 10:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Image URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://cdn.armoredmart.com/products/adp-l4/main.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="mb-2 block">Gallery URLs</Label>
                {gallery.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      type="url"
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("gallery", index, e.target.value)
                      }
                      placeholder="https://cdn.armoredmart.com/products/adp-l4/detail-1.jpg"
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

      default:
        return null;
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {currentStep} of {SECTIONS.length}:{" "}
            {SECTIONS[currentStep - 1].name}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {SECTIONS.map((section, index) => (
            <div key={section.id} className="flex items-center flex-shrink-0">
              <div
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  currentStep > section.id
                    ? "bg-primary text-white"
                    : currentStep === section.id
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
          <div className="flex justify-between gap-4 pb-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createProductMutation.isPending}
            >
              Cancel
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < SECTIONS.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Product"
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
