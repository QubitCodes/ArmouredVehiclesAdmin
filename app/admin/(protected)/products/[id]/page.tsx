"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Image from "next/image";
import { ArrowLeft, Package, Calendar, Edit, Settings, ShoppingCart, Image as ImageIcon, Shield, Trash2, Eye } from "lucide-react";

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
import { useProduct } from "@/hooks/admin/product-management/use-product";
import { useDeleteProduct } from "@/hooks/admin/product-management/use-products";
import { normalizeImageUrl } from "@/lib/utils";

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
      // Handle Category objects (main_category, category, sub_category)
    if ("name" in value && typeof (value as { name: string }).name === "string") {
        return (value as { name: string }).name;
    }

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

  if (typeof value === "string") {
      // Check if it's a JSON array string for specific fields
      if (["vehicle_fitment", "specifications", "features", "materials", "performance", "drive_types", "sizes", "thickness", "colors", "pricing_terms"].includes(fieldName)) {
          try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                  if (parsed.length === 0) return "—";
                  return parsed.filter((item) => item !== "" && item !== null).join(", ");
              }
          } catch (e) {
              // Not valid JSON, treat as normal string
          }
      }
      return value;
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
      "main_category", // maps to 'main_category' (object or id)
      "category",
      "sub_category",
      "certifications",
      "controlled_item_type",
      "vehicle_compatibility", // Was vehicleCompatibility
      "make",
      "model",
      "year",
      "country_of_origin",
      "description",
    ],
  },
  {
    id: 2,
    name: "Technical Description",
    icon: Settings,
    fields: [
      "dimension_length",
      "dimension_width",
      "dimension_height",
      "dimension_unit",
      "materials",
      "features",
      "performance",
      "specifications",
      "technical_description",
      "vehicle_fitment", 
      "sizes",
      "thickness",
      "colors",
      "weight_value",
      "weight_unit",
      "packing_length",
      "packing_width",
      "packing_height",
      "packing_dimension_unit",
      "packing_weight",
      "packing_weight_unit",
      "min_order_quantity",
      "drive_types"
    ],
  },
  {
    id: 3,
    name: "Pricing & Availability",
    icon: ShoppingCart,
    fields: [
      "base_price",
      "currency",
      "pricing_terms",
      "production_lead_time",
      "ready_stock_available",
      "stock",
      "condition",
      "pricing_tiers",
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
      "manufacturing_source",
      "manufacturing_source_name",
      "requires_export_license",
      "has_warranty",
      "warranty",
      "warranty_duration",
      "warranty_duration_unit",
      "warranty_terms",
      "compliance_confirmed",
      "supplier_signature",
      "submission_date", // Was signatureDate
    ],
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const fromVendor = searchParams.get('from') === 'vendor';

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useProduct(productId, !isDeleting);

  const deleteProductMutation = useDeleteProduct();

  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);

  // Handle 404 errors - redirect to listing page if product doesn't exist
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError?.response?.status === 404) {
        // Product doesn't exist, redirect to listing page
        router.replace("/admin/products/admin");
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

    // Special handling for pricing_tiers
    if (fieldName === "pricing_tiers" && Array.isArray(value) && value.length > 0) {
      return (
        <div key={fieldName} className="col-span-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pricing Tiers
          </label>
          <div className="mt-2 border rounded-md overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Min Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Max Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(value as any[]).map((tier, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2">{tier.min_quantity}</td>
                      <td className="px-3 py-2">{tier.max_quantity || "∞"}</td>
                      <td className="px-3 py-2">${Number(tier.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      );
    }

    const formattedValue = formatFieldValue(value, fieldName);

    return (
      <div key={fieldName}>
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {formatFieldName(fieldName)}
        </label>
        <p className="text-foreground mt-2 break-words">
          {formattedValue}
        </p>
      </div>
    );
  };

  const currentSection = SECTIONS.find(s => s.id === activeTab) || SECTIONS[0];

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
        {!fromVendor && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() =>
                window.open(
                  `${
                    process.env.NEXT_PUBLIC_WEBSITE_URL ||
                    "http://localhost:3000"
                  }/product/${product.id}`,
                  "_blank"
                )
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="default" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
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
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-border w-full overflow-x-auto">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2
                ${isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}
              `}
            >
              <Icon className="h-4 w-4" />
              {section.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Main Content Area (Tabs) */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentSection.icon className="h-5 w-5" />
                {currentSection.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 4 ? (
                // Uploads & Media Special Handling
                <div className="space-y-6">
                  {((productData.image as string) || (productData.imageUrl as string)) && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Cover Image</h3>
                      <div className="relative w-full max-w-md aspect-video rounded-md border overflow-hidden">
                        <Image
                          src={normalizeImageUrl((productData.image as string) || (productData.imageUrl as string)) || ""}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {Array.isArray(productData.gallery) && productData.gallery.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Gallery Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {productData.gallery.map((url: string, index: number) => (
                          <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                            <Image
                              src={normalizeImageUrl(url) || ""}
                              alt={`${product.name} gallery ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!productData.image && !productData.imageUrl && (!Array.isArray(productData.gallery) || productData.gallery.length === 0)) && (
                    <p className="text-muted-foreground italic">No media uploaded.</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                   {currentSection.fields.map((fieldName) => renderField(fieldName))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (Timeline / Meta) */}
        <div className="w-full lg:w-80 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created At
                </label>
                <p className="text-sm text-foreground mt-1">
                  {(() => {
                    const dateVal = product.created_at || product.createdAt;
                    if (!dateVal) return "—";
                    const d = new Date(dateVal);
                    return isNaN(d.getTime()) 
                      ? "Invalid Date" 
                      : d.toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        });
                  })()}
                </p>
              </div>
              {(product.updated_at || product.updatedAt) && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Updated
                  </label>
                  <p className="text-sm text-foreground mt-1">
                    {(() => {
                      const dateVal = product.updated_at || product.updatedAt;
                      if (!dateVal) return "—";
                      const d = new Date(dateVal);
                      return isNaN(d.getTime()) 
                        ? "Invalid Date" 
                        : d.toLocaleString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          });
                    })()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                  router.replace("/admin/products/admin");
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
