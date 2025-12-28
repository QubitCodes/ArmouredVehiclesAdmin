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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { DateSelector } from "@/components/ui/date-selector";
import { useCreateProduct } from "@/hooks/admin/product-management/use-products";
import type { CreateProductRequest } from "@/services/admin/product.service";

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
  const createProductMutation = useCreateProduct();
  const [currentStep, setCurrentStep] = useState(1);

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
      readyStockAvailable: false,
      requiresExportLicense: false,
      hasWarranty: false,
      complianceConfirmed: false,
      isFeatured: false,
      actionType: "buy_now",
      materials: [],
      features: [],
      performance: [],
      specifications: [],
      driveTypes: [],
      sizes: [],
      thickness: [],
      colors: [],
      vehicleFitment: [],
      pricingTerms: [],
      gallery: [],
      signatureDate: undefined,
    },
  });

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
      // Only validate required fields per step
      if (currentStep === 1) {
        return field === "name";
      }
      return true;
    });

    const isValid = await form.trigger(
      fieldsToValidate as (keyof ProductFormValues)[]
    );
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
      const cleanedData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (key === "signatureDate") {
          // Handle signatureDate object specially
          if (value && typeof value === "object") {
            const dateValue = value as {
              day?: number;
              month?: number;
              year?: number;
            };
            if (dateValue.day || dateValue.month || dateValue.year) {
              cleanedData[key] = value;
            }
          }
        } else if (Array.isArray(value)) {
          const filtered = value.filter((item) => item !== "");
          if (filtered.length > 0) {
            cleanedData[key] = filtered;
          }
        } else if (value !== "" && value !== undefined && value !== null) {
          cleanedData[key] = value;
        }
      });

      // Console preview of the data
      console.log("=== Product Data Preview ===");
      console.log("Raw form data:", data);
      console.log("Cleaned data to be sent:", cleanedData);
      console.log("Data as JSON:", JSON.stringify(cleanedData, null, 2));
      console.log("===========================");

      await createProductMutation.mutateAsync(
        cleanedData as unknown as CreateProductRequest
      );
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

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code / SKU</FormLabel>
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
                          }}
                          placeholder="Select Main Category"
                        >
                          <option value="">Select Main Category</option>
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
                          }}
                          placeholder="Select Category"
                        >
                          <option value="">Select Category</option>
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
                        >
                          <option value="">Select Subcategory</option>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications / Standards</FormLabel>
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
                name="controlledItemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Controlled Item Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MOD/EOCN Controlled, Dual-use item, ITAR-regulated, DG, Not Controlled" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicleCompatibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Compatibility</FormLabel>
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

                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select Country"
                        >
                          <option value="">Select Country</option>
                          <option value="USA">United States</option>
                          <option value="UAE">United Arab Emirates</option>
                          <option value="UK">United Kingdom</option>
                          <option value="GER">Germany</option>
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border rounded-md"
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
                <CardTitle>TECHNICAL SPECIFICATIONS:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="dimensionLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions - Length</FormLabel>
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
                          <Select
                            value={field.value || "mm"}
                            onChange={field.onChange}
                            placeholder="Unit"
                          >
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">inches</option>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div>
                  <Label className="mb-2 block">Specifications</Label>
                  {specifications.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateArrayItem(
                            "specifications",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="STANAG Level 2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayItem("specifications", index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("specifications")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Specification
                  </Button>
                </div>

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
                          className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border rounded-md"
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
            <Card>
              <CardHeader>
                <CardTitle>AVAILABLE VARIANTS:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Vehicle Fitment</Label>
                  {vehicleFitment.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateArrayItem(
                            "vehicleFitment",
                            index,
                            e.target.value
                          )
                        }
                        placeholder="Front left door, armored variant"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeArrayItem("vehicleFitment", index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("vehicleFitment")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle Fitment
                  </Button>
                </div>

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

                <div>
                  <Label className="mb-2 block">Color Options</Label>
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

            {/* Weight and Dimensions Section */}
            <Card>
              <CardHeader>
                <CardTitle>Weight and Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="weightValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (per unit)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Eg. 1.2"
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
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "kg"}
                            onChange={field.onChange}
                            placeholder="Unit"
                          >
                            <option value="kg">Kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
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
                    name="packingWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Packing Weight (gross)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Eg. 1.2"
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
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "kg"}
                            onChange={field.onChange}
                            placeholder="Unit"
                          >
                            <option value="kg">Kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel className="mb-2 block">
                    Packing Dimensions (L × W × H)
                  </FormLabel>
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="packingLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Eg. 130"
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
                          <FormLabel>Width</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Eg. 90"
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
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Eg. 15"
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
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || "inches"}
                              onChange={field.onChange}
                              placeholder="Unit"
                            >
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                              <option value="inches">Inches</option>
                              <option value="ft">ft</option>
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
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Unit Price (USD or AED) *</FormLabel>
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
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
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

              <div className="py-6">
                <Label className="mb-2 block">
                  Pricing Terms (EXW, FOB, CIF)
                </Label>
                {pricingTerms.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateArrayItem("pricingTerms", index, e.target.value)
                      }
                      placeholder="EXW, FOB, or CIF"
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
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
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
              <CardTitle>COMPLIANCE & DECLARATIONS</CardTitle>
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
                          <option value="">Select</option>
                          <option value="In-House">In-House</option>
                          <option value="Sourced">Sourced</option>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("manufacturingSource") === "Sourced" && (
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
                )}
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
                      >
                        <RadioGroupItem value="yes" label="Yes" />
                        <RadioGroupItem value="no" label="No" />
                      </RadioGroup>
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
                            className="w-full min-h-[100px] px-3 py-2 text-sm bg-input border border-border rounded-md"
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Digital Signature / Name:</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Supplier Digital Signature / Name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DateSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
        <div className="flex items-center gap-2 overflow-x-auto">
          {SECTIONS.map((section, index) => (
            <div key={section.id} className="flex items-center shrink-0">
              <div
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  currentStep === section.id
                    ? "bg-white text-secondary"
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
                  className={`w-2 h-2 rounded-full mx-2 ${
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
          <div className="flex justify-between gap-4 pb-6 pt-4">
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
