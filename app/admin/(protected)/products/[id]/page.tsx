"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Calendar,
  Edit,
  Settings,
  ShoppingCart,
  Image as ImageIcon,
  Shield,
  Eye,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/hooks/admin/product-management/use-product";
import { normalizeImageUrl } from "@/lib/utils";
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
  console.log("Rendering SpecificationsTable", { productId, specs });

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

                  {/* Value-Only Items - Full Width */}
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
    // Handle Category objects (main_category, category, sub_category)
    if (
      "name" in value &&
      typeof (value as { name: string }).name === "string"
    ) {
      return (value as { name: string }).name;
    }

    // Handle date objects
    if (
      fieldName === "signatureDate" &&
      "day" in value &&
      "month" in value &&
      "year" in value
    ) {
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
    if (
      [
        "vehicle_fitment",
        "specifications",
        "features",
        "materials",
        "performance",
        "drive_types",
        "sizes",
        "thickness",
        "colors",
        "pricing_terms",
      ].includes(fieldName)
    ) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return "—";
          return parsed
            .filter((item) => item !== "" && item !== null)
            .join(", ");
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
      "drive_types",
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
  const fromVendor = searchParams.get("from") === "vendor";

  const { data: product, isLoading, error } = useProduct(productId);

  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);

  // Handle 404 errors - redirect to listing page if product doesn't exist
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      if (axiosError?.response?.status === 404) {
        // Product doesn't exist, redirect to listing page
        router.replace("/admin/products");
        return;
      }
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to fetch product";
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
    if (
      fieldName === "pricing_tiers" &&
      Array.isArray(value) &&
      value.length > 0
    ) {
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
                  <tr
                    key={i}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-3 py-2">{tier.min_quantity}</td>
                    <td className="px-3 py-2">{tier.max_quantity || "∞"}</td>
                    <td className="px-3 py-2">
                      ${Number(tier.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

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
        <p className="text-foreground mt-2 break-words">{formattedValue}</p>
      </div>
    );
  };

  const currentSection =
    SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];

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
                  `${process.env.NEXT_PUBLIC_WEBSITE_URL ||
                  "http://localhost:3000"
                  }/product/${product.id}`,
                  "_blank"
                )
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
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
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }
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
                  {((productData.image as string) ||
                    (productData.imageUrl as string)) && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">
                          Cover Image
                        </h3>
                        <div className="relative w-full max-w-md aspect-video rounded-md border overflow-hidden">
                          <Image
                            src={
                              normalizeImageUrl(
                                (productData.image as string) ||
                                (productData.imageUrl as string)
                              ) || ""
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                  {Array.isArray(productData.gallery) &&
                    productData.gallery.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">
                          Gallery Images
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {productData.gallery.map(
                            (url: string, index: number) => (
                              <div
                                key={index}
                                className="relative aspect-square border rounded-md overflow-hidden"
                              >
                                <Image
                                  src={normalizeImageUrl(url) || ""}
                                  alt={`${product.name} gallery ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {!productData.image &&
                    !productData.imageUrl &&
                    (!Array.isArray(productData.gallery) ||
                      productData.gallery.length === 0) && (
                      <p className="text-muted-foreground italic">
                        No media uploaded.
                      </p>
                    )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Render Specifications Table for Technical Description Tab */}
                  {activeTab === 2 && (
                    <div className="mb-8 border-b pb-8">
                      <h3 className="text-lg font-bold mb-4 font-orbitron uppercase tracking-wide">Detailed Specifications</h3>
                      <SpecificationsTable productId={productId} />
                    </div>
                  )}

                  <div className="space-y-4">
                    {activeTab === 2 && (
                      <h3 className="text-lg font-bold mb-4 font-orbitron uppercase tracking-wide">Technical Description</h3>
                    )}
                    <div className="grid gap-6 md:grid-cols-2">
                      {currentSection.fields.map((fieldName) =>
                        renderField(fieldName)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div >

        {/* Sidebar Info (Timeline / Meta) */}
        < div className="w-full lg:w-80 space-y-6" >
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
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
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
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                    })()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div >
      </div >
    </div >
  );
}
