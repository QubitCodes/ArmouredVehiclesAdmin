"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  DollarSign,
  Mail,
  Phone,
  Shield,
  UserCircle,
  FileText,
  Tag,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/admin/order-management/use-order";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { data: order, isLoading, error } = useOrder(orderId);

  // Handle errors
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      if (axiosError?.response?.status === 404) {
        router.replace("/admin/orders");
        return;
      }
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to fetch order";
      toast.error(errorMessage);
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
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
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 dark:text-green-500";
      case "pending_review":
      case "pending_approval":
        return "text-yellow-600 dark:text-yellow-500";
      case "rejected":
      case "cancelled":
        return "text-red-600 dark:text-red-500";
      default:
        return "text-orange-600 dark:text-orange-500";
    }
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
              Order {order.tracking_number || `#${order.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Order Details</p>
          </div>
        </div>
      </div>

      {/* Order Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg font-semibold ${getStatusColor(
                order.order_status
              )}`}
            >
              {order.order_status
                ? order.order_status
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                : "Pending"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {order.total_amount
                ? `${parseFloat(String(order.total_amount)).toFixed(2)} ${
                    order.currency || "AED"
                  }`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="border-none shadow-md gap-0 overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items && order.items.length > 0 ? (
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:bg-muted/5 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted border">
                    {item.product?.featured_image ? (
                      <Image
                        src={item.product.featured_image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Package className="h-10 w-10 text-primary/20" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground line-clamp-1">
                          {item.product?.name || item.productName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-mono font-medium">
                            <Tag className="h-3 w-3" />
                            {item.product?.sku || item.productId}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Base Price
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {order.currency || "AED"} {item.product?.base_price ? parseFloat(String(item.product.base_price)).toFixed(2) : parseFloat(String(item.price)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Quantity
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          × {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Total
                        </span>
                        <span className="text-base font-bold text-primary">
                          {order.currency || "AED"} {(parseFloat(String(item.price)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No items in this order.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Information */}
      {order.user && (
        <Card className="overflow-hidden border-none shadow-md bg-bg-light">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <UserCircle className="h-6 w-6 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {order.user.name || "—"}
                  </p>
                </div>
              </div>

              {order.user.username && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-orange-500/10">
                    <UserCircle className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Username
                    </p>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {order.user.username}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User Type
                  </p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {order.user.user_type || "Customer"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg bg-blue-500/10">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </p>
                  <a
                    href={`mailto:${order.user.email}`}
                    className="text-base font-semibold text-primary hover:underline mt-0.5 block"
                  >
                    {order.user.email || "—"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg bg-green-500/10">
                  <Phone className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {order.user.country_code
                      ? `${order.user.country_code} `
                      : ""}
                    {order.user.phone || "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.statusHistory
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((historyItem, index) => (
                  <div
                    key={historyItem.id}
                    className="relative pl-6 pb-4 last:pb-0"
                  >
                    {index < order.statusHistory!.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
                    )}
                    <div className="relative">
                      <div
                        className="absolute left-[-22px] top-1 h-3 w-3 border-2 border-background bg-primary"
                        style={{ borderRadius: "50%" }}
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`font-semibold ${getStatusColor(
                              historyItem.status
                            )}`}
                          >
                            {historyItem.status.charAt(0).toUpperCase() +
                              historyItem.status.slice(1)}
                          </p>
                          {historyItem.note && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {historyItem.note}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(historyItem.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
