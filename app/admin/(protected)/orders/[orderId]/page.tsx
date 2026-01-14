"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ArrowLeft, Package, Calendar, User, Truck, DollarSign } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/admin/order-management/use-order";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const {
    data: order,
    isLoading,
    error,
  } = useOrder(orderId);

  // Handle errors
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError?.response?.status === 404) {
        router.replace("/admin/orders");
        return;
      }
      const errorMessage = axiosError?.response?.data?.message || axiosError?.message || "Failed to fetch order";
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
      case "completed":
      case "delivered":
        return "text-green-600 dark:text-green-500";
      case "pending":
        return "text-yellow-600 dark:text-yellow-500";
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
              Order {order.trackingNumber || `#${order.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Order Details
            </p>
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
            <p className={`text-lg font-semibold ${getStatusColor(order.status)}`}>
              {order.status
                ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
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
              ${order.total 
                ? parseFloat(order.total).toFixed(2)
                : typeof order.totalAmount === 'number' 
                ? order.totalAmount.toFixed(2) 
                : parseFloat(String(order.totalAmount || '0')).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {order.estimatedDelivery && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Estimated Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground">
                {new Date(order.estimatedDelivery).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Information */}
      {order.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Customer ID
                </label>
                <p className="text-foreground mt-2 font-mono text-sm">
                  {order.user.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </label>
                <p className="text-foreground mt-2">
                  {order.user.name || "—"}
                </p>
              </div>
              {order.user.username && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Username
                  </label>
                  <p className="text-foreground mt-2">
                    {order.user.username}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </label>
                <p className="text-foreground mt-2">
                  {order.user.email || "—"}
                </p>
              </div>
              {order.user.phone && (
                <div>
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Phone
                  </label>
                  <p className="text-foreground mt-2">
                    {order.user.phone}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.productId} • Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-foreground">
                    ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(String(item.price)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items in this order.</p>
          )}
        </CardContent>
      </Card>

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
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((historyItem, index) => (
                  <div key={historyItem.id} className="relative pl-6 pb-4 last:pb-0">
                    {index < order.statusHistory!.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
                    )}
                    <div className="relative">
                      <div className="absolute left-[-22px] top-1 h-3 w-3 border-2 border-background bg-primary" style={{ borderRadius: '50%' }} />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-semibold ${getStatusColor(historyItem.status)}`}>
                            {historyItem.status.charAt(0).toUpperCase() + historyItem.status.slice(1)}
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

      {/* Order Timeline */}
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
              {formatDate(order.createdAt)}
            </p>
          </div>
          {order.updatedAt && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Last Updated
              </label>
              <p className="text-foreground mt-2">
                {formatDate(order.updatedAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

