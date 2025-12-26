"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Package, DollarSign, Tag, BarChart3, Calendar, Edit } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "@/hooks/admin/product-management/use-product";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const {
    data: product,
    isLoading,
    error,
  } = useProduct(productId);

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error("Error fetching product:", error);
      const axiosError = error as any;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.message || "Failed to fetch product";
      toast.error(errorMessage);
    }
  }, [error]);

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
        <Button variant="default">
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      {/* Image and Basic Info Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Image */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Product Name
                  </label>
                  <p className="text-lg font-medium text-foreground mt-2">
                    {product.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price
                  </label>
                  <p className="text-lg font-bold text-foreground mt-2">
                    ${typeof product.price === 'number' 
                      ? product.price.toFixed(2) 
                      : parseFloat(String(product.price || '0')).toFixed(2)}
                  </p>
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Description
                  </label>
                  <p className="text-foreground mt-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {product.category && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </label>
                  <p className="text-foreground mt-2">
                    {product.category}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status & Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <p className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    product.status === "active" || !product.status
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500"
                  }`}
                >
                  {product.status
                    ? product.status.charAt(0).toUpperCase() +
                      product.status.slice(1)
                    : "Active"}
                </span>
              </p>
            </div>
            {product.stock !== undefined && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Stock Quantity
                </label>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {product.stock}
                </p>
              </div>
            )}
            {product.sku && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  SKU
                </label>
                <p className="text-foreground mt-2 font-mono">
                  {product.sku}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}

