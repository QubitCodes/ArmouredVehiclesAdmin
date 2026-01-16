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
import { Select } from "@/components/ui/select";
import { useUpdateOrder } from "@/hooks/admin/order-management/use-update-order";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { data: order, isLoading, error } = useOrder(orderId);
  const { mutate: updateOrder, isPending: isUpdating } =
    useUpdateOrder(orderId);

  // Payment Confirmation Dialog State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_mode: "",
    transaction_id: "",
  });

  const handlePaymentStatusChange = (newStatus: string) => {
    if (newStatus === "paid") {
      setIsPaymentDialogOpen(true);
    } else {
      updateOrder({ payment_status: newStatus });
    }
  };

  const handlePaymentConfirm = () => {
    if (!paymentForm.payment_mode || !paymentForm.transaction_id) {
      toast.error("Please fill in all payment details");
      return;
    }

    const transaction_details = JSON.stringify({
      payment_mode: paymentForm.payment_mode,
      transaction_id: paymentForm.transaction_id,
    });

    updateOrder({
      payment_status: "paid",
      transaction_details,
    });
    setIsPaymentDialogOpen(false);
    setPaymentForm({ payment_mode: "", transaction_id: "" });
  };

  // Shipment Confirmation Dialog State
  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    tracking_number: "",
    provider: "FedEx",
  });

  const handleShipmentStatusChange = (newStatus: string) => {
    if (newStatus === "shipped") {
      setIsShipmentDialogOpen(true);
    } else {
      updateOrder({ shipment_status: newStatus });
    }
  };

  const handleShipmentConfirm = () => {
    if (shipmentForm.tracking_number.length < 5) {
      toast.error("Tracking number must be at least 5 digits");
      return;
    }

    const shipment_details = JSON.stringify({
      tracking_number: shipmentForm.tracking_number,
      provider: shipmentForm.provider,
    });

    updateOrder({
      shipment_status: "shipped",
      shipment_details,
    });
    setIsShipmentDialogOpen(false);
    setShipmentForm({ tracking_number: "", provider: "FedEx" });
  };

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
  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "paid":
        return "text-green-600 dark:text-green-500";
      case "pending":
        return "text-yellow-600 dark:text-yellow-500";
      case "failed":
        return "text-red-600 dark:text-red-500";
      case "refunded":
        return "text-orange-600 dark:text-orange-500";
      default:
        return "text-orange-600 dark:text-orange-500";
    }
  };
  const getShipmentStatusColor = (status?: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 dark:text-green-500";
      case "pending":
      case "processing":
      case "shipped":
        return "text-yellow-600 dark:text-yellow-500";
      case "returned":
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Amount Card */}
        <Card className="border-none shadow-sm flex flex-col justify-between">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2 font-bold uppercase text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {order.total_amount
                ? `${parseFloat(String(order.total_amount)).toFixed(2)} ${
                    order.currency || "AED"
                  }`
                : "—"}
            </p>
          </CardContent>
        </Card>

        {/* Order Status Card */}
        <Card className="border-none shadow-sm flex flex-col gap-0 justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={`text-lg font-bold ${getStatusColor(
                order.order_status
              )}`}
            >
              {order.order_status
                ? order.order_status
                    .split("_")
                    .map(
                      (word: string) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")
                : "Pending"}
            </p>
            <Select
              value={order.order_status || "pending_review"}
              onChange={(e) => updateOrder({ order_status: e.target.value })}
              disabled={isUpdating}
              className="h-9 text-xs"
            >
              <option value="pending_review">Pending Review</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </CardContent>
        </Card>

        {/* Payment Status Card */}
        <Card className="border-none shadow-sm flex flex-col gap-0 justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={`text-lg font-bold capitalize ${getPaymentStatusColor(
                order.payment_status || "pending"
              )}`}
            >
              {order.payment_status || "Pending"}
            </p>
            <Select
              value={order.payment_status || "pending"}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              disabled={isUpdating || order.order_status !== "approved"}
              className="h-9 text-xs"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
          </CardContent>
        </Card>

        {/* Shipment Status Card */}
        <Card className="border-none shadow-sm flex flex-col gap-0 justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
              Shipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={`text-lg font-bold capitalize ${getShipmentStatusColor(
                order.shipment_status || "pending"
              )}`}
            >
              {" "}
              {order.shipment_status || "Pending"}
            </p>
            <Select
              value={order.shipment_status || "pending"}
              onChange={(e) => handleShipmentStatusChange(e.target.value)}
              disabled={isUpdating || order.payment_status !== "paid"}
              className="h-9 text-xs"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </Select>
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
                          {order.currency || "AED"}{" "}
                          {item.product?.base_price
                            ? parseFloat(
                                String(item.product.base_price)
                              ).toFixed(2)
                            : parseFloat(String(item.price)).toFixed(2)}
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
                          {order.currency || "AED"}{" "}
                          {(
                            parseFloat(String(item.price)) * item.quantity
                          ).toFixed(2)}
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
              <p className="text-muted-foreground font-medium">
                No items in this order.
              </p>
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
                  (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((historyItem: any, index: number) => (
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
      {/* Payment Confirmation Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment_mode">Payment Mode</Label>
              <Input
                id="payment_mode"
                placeholder="e.g. Credit Card, Bank Transfer"
                value={paymentForm.payment_mode}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, payment_mode: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transaction_id">Transaction ID</Label>
              <Input
                id="transaction_id"
                placeholder="Enter transaction reference"
                value={paymentForm.transaction_id}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    transaction_id: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentConfirm} disabled={isUpdating}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Confirmation Dialog */}
      <Dialog
        open={isShipmentDialogOpen}
        onOpenChange={setIsShipmentDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking_number">Tracking Number</Label>
              <Input
                id="tracking_number"
                placeholder="Enter 5 or more digits"
                value={shipmentForm.tracking_number}
                onChange={(e) =>
                  setShipmentForm({
                    ...shipmentForm,
                    tracking_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={shipmentForm.provider}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShipmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleShipmentConfirm} disabled={isUpdating}>
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
