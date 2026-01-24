"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ArrowLeft, Package, Calendar, Edit, Settings, ShoppingCart, Image as ImageIcon, Shield, Trash2 } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVendorProduct } from "@/hooks/vendor/product-management/use-products";
import { useDeleteVendorProduct } from "@/hooks/vendor/product-management/use-products";
import { useProductSpecifications } from "@/hooks/admin/product-management/use-product-specifications";

type Specification = {
  id: string;
  product_id: number;
  label?: string;
  value?: string;
  type: 'general' | 'title_only' | 'value_only';
  active: boolean;
  sort: number;
};

// Specifications Table Component
// Specifications Table Component
function SpecificationsTable({ productId }: { productId: string }) {
  const { data: specs, isLoading } = useProductSpecifications(productId);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading specifications...</div>;
  if (!specs || specs.length === 0) return null;

  const sections: { title: Specification; items: Specification[] }[] = [];
  let current: { title: Specification; items: Specification[] } | null = null;

  // Sort and Filter Active
  const activeSpecs = Array.isArray(specs)
    ? specs.filter((s: any) => s.active).sort((a: any, b: any) => a.sort - b.sort)
    : [];

  activeSpecs.forEach((spec: any) => {
    if (spec.type === 'title_only') {
      current = { title: spec, items: [] };
      sections.push(current);
    } else if (current) {
      current.items.push(spec);
    } else {
      // Fallback for specs without a header
      current = {
        title: { id: 'fallback', label: 'General Details', type: 'title_only' } as any,
        items: [spec]
      };
      sections.push(current);
    }
  });

  return (
    <div className="border border-border rounded-md overflow-hidden bg-background">
      {sections.map((section, sIdx) => {
        return (
          <div key={section.title.id || sIdx} className="flex flex-col">
            {/* Section Header */}
            <div className="bg-[#E1D9CC] border-t border-b border-border py-2.5 px-4">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider font-orbitron">
                {section.title.label}
              </h4>
            </div>

            {/* Items */}
            {(() => {
              const generalItems = section.items.filter((it: any) => it.type !== 'value_only' && it.label && it.value);
              const valueOnlyItems = section.items.filter((it: any) => it.type === 'value_only' || (!it.label && it.value));

              // Custom sort for general items: Width MUST come after Length if both exist
              generalItems.sort((a, b) => {
                const labelA = (a.label || "").toLowerCase();
                const labelB = (b.label || "").toLowerCase();
                if (labelA.includes('length') && labelB.includes('width')) return -1;
                if (labelA.includes('width') && labelB.includes('length')) return 1;
                return 0; // maintain original sort for others
              });

              return (
                <div className="bg-background">
                  {/* General Items - 1 Column Grid for Strict Vertical Stacking */}
                  {generalItems.length > 0 && (
                    <div className="grid grid-cols-1 border-b border-border last:border-b-0">
                      {generalItems.map((item: any, idx: number) => {
                        const isLastItem = idx === generalItems.length - 1;

                        return (
                          <div
                            key={item.id}
                            className={`flex border-border ${!isLastItem ? 'border-b' : ''}`}
                          >
                            <div className="w-1/3 min-w-[120px] bg-muted/30 py-3 px-4 border-r border-border flex items-center">
                              <span className="text-sm font-semibold text-foreground">
                                {item.label}
                              </span>
                            </div>
                            <div className="flex-1 py-3 px-4 flex items-center">
                              <span className="text-sm text-foreground">
                                {item.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Value-Only Items - Full Width, No intermediate borders */}
                  {valueOnlyItems.length > 0 && (
                    <div className="w-full">
                      {valueOnlyItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="py-2 px-6 bg-background"
                        >
                          <div className="text-sm text-foreground flex items-start">
                            <span className="mr-2 text-primary mt-1 text-[8px]">●</span>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

// Helper function to format field names (camelCase to Title Case)
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};


// Helper function to format field value
const formatFieldValue = (value: unknown, fieldName: string): string => {
  if (value === undefined || value === null) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }
    return value.filter((item) => item !== "" && item !== null).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    // Handle date objects
    if (fieldName === "signatureDate" && "day" in value && "month" in value && "year" in value) {
      const dateObj = value as { day?: number; month?: number; year?: number };
      if (dateObj.day && dateObj.month && dateObj.year) {
        return `${dateObj.day}/${dateObj.month}/${dateObj.year}`;
      }
    }
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    // Handle currency fields
    if (fieldName.toLowerCase().includes("price")) {
      return `$${value.toFixed(2)}`;
    }
    return value.toString();
  }

  return String(value);
};

// Section definitions matching the form sections
const SECTIONS = [
  {
    id: 1,
    name: "Basic Information",
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
    icon: ShoppingCart,
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
    icon: ImageIcon,
    fields: ["image", "imageUrl", "gallery"],
  },
  {
    id: 5,
    name: "Declarations",
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

export default function VendorProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useVendorProduct(isDeleting ? null : productId);

  const deleteProductMutation = useDeleteVendorProduct();

  // Handle 404 errors - redirect to listing page if product doesn't exist
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError?.response?.status === 404) {
        // Product doesn't exist, redirect to listing page
        router.replace("/vendor/products");
        return;
      }
      const errorMessage = axiosError?.response?.data?.message || axiosError?.message || "Failed to fetch product";
      toast.error(errorMessage);
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex w-full flex-col gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Product not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const productData = product as unknown as Record<string, unknown>;

  // Render field in section
  const renderField = (fieldName: string) => {
    const value = productData[fieldName];
    const formattedValue = formatFieldValue(value, fieldName);

    if (fieldName === 'description') {
      return (
        <div key={fieldName} className="col-span-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {formatFieldName(fieldName)}
          </label>
          <div
            className="mt-2 prose max-w-none dark:prose-invert [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:max-w-full [&_img]:rounded-md"
            dangerouslySetInnerHTML={{ __html: value as string || '' }}
          />
        </div>
      );
    }

    return (
      <div key={fieldName}>
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {formatFieldName(fieldName)}
        </label>
        <p className="text-foreground mt-2">
          {formattedValue}
        </p>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Product Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => router.push(`/vendor/products/${product.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteProductMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Image */}
      {((productData.image as string) || (productData.imageUrl as string)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Product Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={(productData.image as string) || (productData.imageUrl as string)}
              alt={product.name}
              className="w-full max-w-md object-cover"
            />
          </CardContent>
        </Card>
      )}

      {/* Render all sections */}
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {section.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Render Specifications Table for Technical Description Tab */}
              {/* Render Specifications Table for Technical Description Tab */}
              {section.id === 2 && (
                <div className="mb-10 border-b pb-10">
                  <h3 className="text-lg font-bold mb-4 font-orbitron uppercase tracking-wide">DETAILED SPECIFICATIONS</h3>
                  <SpecificationsTable productId={productId} />
                </div>
              )}

              <div className="space-y-4">
                {section.id === 2 && (
                  <h3 className="text-lg font-bold mb-4 font-orbitron uppercase tracking-wide">TECHNICAL DESCRIPTION</h3>
                )}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {section.fields.map((fieldName) => renderField(fieldName))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Created At
            </label>
            <p className="text-foreground mt-2">
              {new Date(product.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {product.updatedAt && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Last Updated
              </label>
              <p className="text-foreground mt-2">
                {new Date(product.updatedAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product &quot;{product.name}&quot;
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setShowDeleteDialog(false);
                  setIsDeleting(true); // Disable product query before deletion
                  await deleteProductMutation.mutateAsync(productId);
                  toast.success("Product deleted successfully!");
                  // Navigate immediately after deletion
                  router.replace("/vendor/products");
                } catch (error) {
                  console.error(error);
                  setIsDeleting(false); // Re-enable query if deletion fails
                  const axiosError = error as AxiosError<{
                    message?: string;
                    error?: string;
                  }>;

                  let errorMessage = "Failed to delete product. Please try again.";

                  if (axiosError?.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                  } else if (axiosError?.response?.data?.error) {
                    errorMessage = axiosError.response.data.error;
                  }

                  toast.error(errorMessage);
                  setShowDeleteDialog(false);
                }
              }}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

