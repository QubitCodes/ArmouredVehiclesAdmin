"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/admin/auth.service";
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
  History,
  CheckCircle2,
  Clock,
  UserCog,
  Info,
  Copy,
  AlertTriangle,
  Store,
  Download
} from "lucide-react";
import Image from "next/image";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/admin/order-management/use-order";
import { Select } from "@/components/ui/select";
import { useUpdateOrder } from "@/hooks/admin/order-management/use-update-order";
import { normalizeImageUrl } from "@/lib/utils";
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
  const domain = (params?.domain as string) || "admin";

  const { data: order, isLoading, error } = useOrder(orderId);
  const { mutate: updateOrder, isPending: isUpdating } =
    useUpdateOrder(orderId);

  // User Role State needed for header display logic
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [canManageOrders, setCanManageOrders] = useState(false);

  useEffect(() => {
    const user = authService.getUserDetails();
    if (user && user.userType) {
      setUserRole(user.userType.toLowerCase());
      // Check for order.manage permission
      if (user.userType === 'super_admin' || authService.hasPermission('order.manage')) {
        setCanManageOrders(true);
      }
    }
    setRoleLoading(false);
  }, []);

  // Payment Confirmation Dialog State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_mode: "Bank Transfer",
    transaction_id: "",
    sender_bank: "",
    sender_name: "",
    receipt_no: "",
    collected_by: "",
    cheque_no: "",
    issuing_bank: "",
    notes: ""
  });

  const handlePaymentStatusChange = (newStatus: string) => {
    if (newStatus === "paid") {
      setIsPaymentDialogOpen(true);
    } else {
      updateOrder({ payment_status: newStatus as any });
    }
  };

  const handlePaymentConfirm = () => {
    // Basic validation
    if (paymentForm.payment_mode === "Bank Transfer" && (!paymentForm.transaction_id || !paymentForm.sender_bank)) {
      toast.error("Please fill in reference number and bank name");
      return;
    }

    const newPaymentEntry: any = {
      payment_mode: paymentForm.payment_mode,
      transaction_id: paymentForm.transaction_id || `MANUAL-${Date.now()}`,
      manual_entry: true,
      timestamp: new Date().toISOString(),
      offline_details: {}
    };

    if (paymentForm.payment_mode === "Bank Transfer") {
      newPaymentEntry.offline_details = {
        sender_bank: paymentForm.sender_bank,
        sender_name: paymentForm.sender_name
      };
    } else if (paymentForm.payment_mode === "Cash") {
      newPaymentEntry.offline_details = {
        collected_by: paymentForm.collected_by,
        receipt_no: paymentForm.receipt_no
      };
    } else if (paymentForm.payment_mode === "Cheque") {
      newPaymentEntry.offline_details = {
        cheque_no: paymentForm.cheque_no,
        issuing_bank: paymentForm.issuing_bank
      };
    }

    if (paymentForm.notes) {
      newPaymentEntry.notes = paymentForm.notes;
    }

    // Parse existing or start new array
    let currentDetails: any[] = [];
    try {
      const raw = (order as any).transaction_details;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        currentDetails = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (e) {
      console.error("Error parsing transaction_details", e);
    }

    const transaction_details = JSON.stringify([...currentDetails, newPaymentEntry]);

    updateOrder({
      payment_status: "paid",
      transaction_details,
    });
    setIsPaymentDialogOpen(false);
    setPaymentForm({
      payment_mode: "Bank Transfer",
      transaction_id: "",
      sender_bank: "",
      sender_name: "",
      receipt_no: "",
      collected_by: "",
      cheque_no: "",
      issuing_bank: "",
      notes: ""
    });
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
      updateOrder({ shipment_status: newStatus as any });
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

  // View Details Dialog State
  const [viewPaymentDialogOpen, setViewPaymentDialogOpen] = useState(false);
  const [viewShipmentDialogOpen, setViewShipmentDialogOpen] = useState(false);

  // Handle errors
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      if (axiosError?.response?.status === 404) {
        router.replace(`/${domain}/orders`);
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

  const formatOrderId = (id?: string) => {
    if (!id) return "—";
    const cleaned = id.replace(/^#/, "");
    if (cleaned.length === 8) {
      return `#${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return `#${cleaned}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Order ID copied to clipboard");
  };

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
      case "vendor_approved":
        return "text-green-600 dark:text-green-500";
      case "pending_review":
      case "pending_approval":
      case "order_received":
        return "text-yellow-600 dark:text-yellow-500";
      case "rejected":
      case "cancelled":
      case "vendor_rejected":
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
      case "shipped":
        return "text-green-600 dark:text-green-500";
      case "pending":
      case "processing":
      case "admin_received":
        return "text-yellow-600 dark:text-yellow-500";
      case "vendor_shipped":
        return "text-blue-600 dark:text-blue-500";
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Order {
                userRole === 'vendor'
                  ? (order.order_id ? formatOrderId(order.order_id) : (order.tracking_number || `#${order.id.slice(0, 8)}`))
                  : (order.order_group_id ? formatOrderId(order.order_group_id) : (order.order_id ? formatOrderId(order.order_id) : `#${order.id.slice(0, 8)}`))
              }
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                onClick={() => copyToClipboard(
                  userRole === 'vendor'
                    ? formatOrderId(order.order_id || order.id.slice(0, 8))
                    : formatOrderId(order.order_group_id || order.order_id || order.id.slice(0, 8))
                )}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Order Details</p>
          </div>
        </div>
      </div>

      {/* Order Request Alert Banner */}
      {(order as any).type === 'request' && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="px-4 py-2 flex items-start gap-4">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
                Order Request - Approval Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                This is a quote request submitted by the customer. It requires manual review and approval.
                Payment must be collected outside the platform before processing the order.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
              {((order as any).group_total_amount && userRole !== 'vendor')
                ? `${parseFloat(String((order as any).group_total_amount)).toFixed(2)} ${order.currency || "AED"}`
                : (order.total_amount
                  ? `${parseFloat(String(order.total_amount)).toFixed(2)} ${order.currency || "AED"}`
                  : "—")
              }
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
            {/* Order Status Select */}
            <Select
              value={order.order_status || "order_received"}
              onChange={(e) => updateOrder({ order_status: e.target.value as any })}
              disabled={isUpdating || roleLoading || (!canManageOrders && userRole !== 'vendor') || (userRole === 'vendor' && !['order_received', 'vendor_approved', 'vendor_rejected'].includes(order.order_status))}
              className="h-9 text-xs"
            >
              {roleLoading ? (
                <option disabled>Loading options...</option>
              ) : userRole === 'vendor' ? (
                <>
                  <option value="order_received">Order Received</option>
                  <option value="vendor_approved">Approve Order</option>
                  <option value="vendor_rejected">Reject Order</option>
                </>
              ) : (
                <>
                  <option value="order_received">Order Received</option>
                  <option value="vendor_approved">Vendor Approved</option>
                  <option value="vendor_rejected">Vendor Rejected</option>

                  {/* General Approval - Visible if has 'order.approve' */}
                  {(authService.hasPermission("order.approve")) && (
                    <option value="approved">Approved</option>
                  )}

                  {/* Controlled Approval - Visible if has 'order.controlled.approve' */}
                  {(authService.hasPermission("order.controlled.approve")) && (
                    <option value="approved_controlled">Approved (Controlled)</option>
                  )}

                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
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
              disabled={isUpdating || userRole === 'vendor' || !canManageOrders} // Disabled for vendor always, enabled for authorized admins
              className="h-9 text-xs"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>

            {/* Payment Details Button */}
            {(order as any).transaction_details && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-8"
                onClick={() => setViewPaymentDialogOpen(true)}
              >
                <Info className="h-3.5 w-3.5 mr-2" />
                View Details
              </Button>
            )}
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
              {order.shipment_status ? order.shipment_status.replace('_', ' ') : "Pending"}
            </p>
            <Select
              value={order.shipment_status || "pending"}
              onChange={(e) => handleShipmentStatusChange(e.target.value)}
              disabled={isUpdating || !canManageOrders || (userRole === 'vendor' && !['pending', 'vendor_shipped'].includes(order.shipment_status || 'pending'))}
              className="h-9 text-xs"
            >
              {userRole === 'vendor' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="vendor_shipped">Shipped to Warehouse</option>
                  {(!['pending', 'vendor_shipped'].includes(order.shipment_status || 'pending')) && (
                    <>
                      <option value="admin_received">Received at Warehouse</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped to Customer</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Returned</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="vendor_shipped">Vendor Shipped</option>
                  <option value="admin_received">Received at Warehouse</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped to Customer</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </Select>

            {/* Shipment Details Button */}
            {((order.shipment_status === 'shipped' || order.shipment_status === 'delivered' || order.shipment_status === 'vendor_shipped') &&
              (order.tracking_number || (order as any).shipment_details)) && (
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-8" onClick={() => setViewShipmentDialogOpen(true)}>
                  <Info className="h-3.5 w-3.5 mr-2" />
                  View Details
                </Button>
              )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md gap-0 overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            // Determine if we should show grouped views (Admin) or single (Vendor/Legacy)
            // Check if grouped_orders exists and has items
            const groupedOrders: any[] = (order as any).grouped_orders || [];
            const ordersToDisplay = groupedOrders.length > 0 ? groupedOrders : [order];

            return ordersToDisplay.map((subOrder, groupIndex) => (
              <div key={subOrder.id} className="border-b last:border-b-0">
                {/* Sub-Header for Grouped Orders - Always Show */}
                <div className="bg-muted/50 px-6 py-3 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                      Sub-Order {formatOrderId(subOrder.order_id || subOrder.id.slice(0, 8))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                        onClick={() => copyToClipboard(formatOrderId(subOrder.order_id || subOrder.id))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                    <span className="text-muted-foreground mx-2 hidden sm:inline">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium hidden sm:inline">Sold by:</span>
                      {subOrder.vendor ? (
                        <a
                          href={`/${domain}/vendors/${subOrder.vendor.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md border border-transparent hover:border-border hover:shadow-sm"
                        >
                          <Store className="h-3.5 w-3.5 text-primary" />
                          {subOrder.vendor.username || subOrder.vendor.name}
                        </a>
                      ) : (subOrder.vendor_id === 'admin' || !subOrder.vendor_id ? (
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          Armoured Vehicles (Admin)
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Vendor ID: {subOrder.vendor_id.slice(0, 8)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(subOrder.order_status).replace('text-', 'bg-').replace('600', '100')} ${getStatusColor(subOrder.order_status)}`}>
                      {subOrder.order_status?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>


                {/* Items List */}
                <div className="divide-y divide-border">
                  {subOrder.items && subOrder.items.length > 0 ? (
                    subOrder.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:bg-muted/5 transition-colors"
                      >
                        {/* Product Image */}
                        <a
                          href={`/${domain}/product/${item.product?.id || item.productId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted border hover:opacity-80 transition-opacity"
                        >
                          {item.product?.media && item.product.media.length > 0 ? (
                            <Image
                              src={normalizeImageUrl(item.product.media[0].url) || ""}
                              alt={item.productName || item.product?.name || "Product Image"}
                              fill
                              className="object-cover"
                            />
                          ) : item.product?.featured_image ? (
                            <Image
                              src={normalizeImageUrl(item.product.featured_image) || ""}
                              alt={item.productName || item.product?.name || "Product Image"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src="/images/placeholder.jpg"
                              alt="Placeholder"
                              fill
                              className="object-cover opacity-50"
                            />
                          )}
                        </a>

                        {/* Product Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <a
                                href={`/${domain}/product/${item.product?.id || item.productId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-bold text-foreground line-clamp-1 hover:text-primary hover:underline"
                              >
                                {item.product?.name || item.productName}
                              </a>
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
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        No items in this sub-order.
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial Summary Footer */}
                <div className="bg-muted/10 p-4 border-t flex flex-col items-end gap-2">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal (Base):</span>
                      <span className="font-medium">{order.currency || "AED"} {(parseFloat(subOrder.total_amount || "0") - parseFloat(subOrder.vat_amount || "0") - parseFloat(subOrder.total_shipping || "0") - parseFloat(subOrder.total_packing || "0")).toFixed(2)}</span>
                    </div>
                    {/* Shipping & Packing - Hide if 0 */}
                    {parseFloat(subOrder.total_shipping || "0") > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Shipping:</span>
                        <span className="font-medium">{order.currency || "AED"} {parseFloat(subOrder.total_shipping || "0").toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(subOrder.total_packing || "0") > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Packing:</span>
                        <span className="font-medium">{order.currency || "AED"} {parseFloat(subOrder.total_packing || "0").toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT (5%):</span>
                      <span className="font-medium">{order.currency || "AED"} {parseFloat(subOrder.vat_amount || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-foreground border-t pt-2">
                      <span>Total Cost (Client Paid):</span>
                      <span className="font-medium">{order.currency || "AED"} {parseFloat(subOrder.total_amount || "0").toFixed(2)}</span>
                    </div>

                    {/* Only show commission and receivable if it is a VENDOR order (has vendor_id and not admin) */}
                    {subOrder.vendor_id && subOrder.vendor_id !== 'admin' && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Commission to Admin:</span>
                          <span className="font-medium text-red-500">- {order.currency || "AED"} {parseFloat(subOrder.admin_commission || "0").toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold text-foreground">
                          <span>Total Receivable (Vendor):</span>
                          <span className="text-green-600">{order.currency || "AED"} {(parseFloat(subOrder.total_amount || "0") - parseFloat(subOrder.admin_commission || "0")).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </CardContent>
      </Card>

      {/* Customer Information - HIDDEN FOR VENDOR */}
      {userRole !== 'vendor' && order.user && (
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
      {/* Status History */}
      {order.status_history && (
        <Card className="border-none shadow-md overflow-hidden bg-background">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <History className="h-5 w-5 text-primary" />
              Order Status History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative space-y-0">
              {order.status_history.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No status updates recorded.</p>
              ) : (
                <>
                  {/* Vertical line that spans all items except the last one */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border lg:left-[11px]" />

                  {order.status_history
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((historyItem, index) => (
                      <div
                        key={`${historyItem.timestamp}-${index}`}
                        className="relative pl-10 pb-10 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>

                        <div className="flex flex-col gap-4">
                          {/* Header: Note and Timestamp */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-base font-bold text-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                {historyItem.note || "Order updated"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(historyItem.timestamp)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border text-xs font-semibold text-muted-foreground">
                              <UserCog className="h-3.5 w-3.5" />
                              By: {historyItem.updated_by?.slice(0, 8) || "System"}
                            </div>
                          </div>

                          {/* Status Badges Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Order Status */}
                            <div className="flex flex-col p-3 rounded-xl bg-background border shadow-sm">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Package className="h-3 w-3" />
                                Order Status
                              </span>
                              <span className={`${getStatusColor(historyItem.status)} text-sm font-bold capitalize`}>
                                {/* Handle various status strings safely */}
                                {(historyItem.status || "Unknown").replace(/_/g, " ")}
                              </span>
                            </div>

                            {/* Payment Status */}
                            <div className="flex flex-col p-3 rounded-xl bg-background border shadow-sm">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <DollarSign className="h-3 w-3" />
                                Payment Status
                              </span>
                              <span className={`${getPaymentStatusColor(historyItem.payment_status || "pending")} text-sm font-bold capitalize`}>
                                {historyItem.payment_status || "Pending"}
                              </span>
                            </div>

                            {/* Shipment Status */}
                            <div className="flex flex-col p-3 rounded-xl bg-background border shadow-sm">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <ShoppingBag className="h-3 w-3" />
                                Shipment Status
                              </span>
                              <span className={`${getShipmentStatusColor(historyItem.shipment_status || "pending")} text-sm font-bold capitalize`}>
                                {historyItem.shipment_status || "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Payment Confirmation Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Offline Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment_mode">Payment Type</Label>
              <Select
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                className="h-10 text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </div>

            {paymentForm.payment_mode === "Bank Transfer" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="transaction_id">Reference Number *</Label>
                  <Input
                    id="transaction_id"
                    placeholder="e.g., TRN-12345678"
                    value={paymentForm.transaction_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sender_bank">Sender Bank *</Label>
                  <Input
                    id="sender_bank"
                    placeholder="e.g., Chase Bank"
                    value={paymentForm.sender_bank}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sender_bank: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="sender_name">Account Name / Sender Name</Label>
                  <Input
                    id="sender_name"
                    placeholder="e.g., John Doe's Business Account"
                    value={paymentForm.sender_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sender_name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {paymentForm.payment_mode === "Cash" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="collected_by">Collected By *</Label>
                  <Input
                    id="collected_by"
                    placeholder="Staff name"
                    value={paymentForm.collected_by}
                    onChange={(e) => setPaymentForm({ ...paymentForm, collected_by: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receipt_no">Receipt No</Label>
                  <Input
                    id="receipt_no"
                    placeholder="Manual receipt ID"
                    value={paymentForm.receipt_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receipt_no: e.target.value })}
                  />
                </div>
              </div>
            )}

            {paymentForm.payment_mode === "Cheque" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cheque_no">Cheque Number *</Label>
                  <Input
                    id="cheque_no"
                    placeholder="000123"
                    value={paymentForm.cheque_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cheque_no: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issuing_bank">Issuing Bank *</Label>
                  <Input
                    id="issuing_bank"
                    placeholder="Bank Name"
                    value={paymentForm.issuing_bank}
                    onChange={(e) => setPaymentForm({ ...paymentForm, issuing_bank: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Internal)</Label>
              <Input
                id="notes"
                placeholder="Optional comments about this payment"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
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
      {/* View Payment Details Dialog */}
      <Dialog open={viewPaymentDialogOpen} onOpenChange={setViewPaymentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {(() => {
              const raw = (order as any).transaction_details;
              if (!raw) return <p className="text-center text-muted-foreground">No details available.</p>;

              let payments: any[] = [];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                const candidates = Array.isArray(parsed) ? parsed : [parsed];
                // Filter out empty entries (like legacy default {})
                payments = candidates.filter(p => p && (p.payment_mode || p.transaction_id || p.session_id));
              } catch (e) {
                return <p className="text-center text-red-500">Error rendering details.</p>;
              }

              if (payments.length === 0) return <p className="text-center text-muted-foreground">No details available.</p>;

              // Sort by timestamp descending (latest first)
              const sortedPayments = [...payments].sort((a, b) => {
                return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
              });

              return sortedPayments.map((payment, idx) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {idx === 0 ? "Latest Attempt" : `Previous Attempt (${sortedPayments.length - idx})`}
                    </span>
                    {payment.timestamp && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatDate(payment.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Mode</p>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        {payment.payment_mode || "—"}
                        {payment.payment_status === 'paid' && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Paid
                          </span>
                        )}
                        {payment.payment_status === 'pending' && (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                            Pending
                          </span>
                        )}
                        {(payment.payment_status === 'incomplete' || payment.payment_status === 'cancelled') && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-600/20">
                            {payment.payment_status === 'incomplete' ? 'Incomplete' : 'Cancelled'}
                          </span>
                        )}
                        {payment.payment_status === 'failed' && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            Failed
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                        {String(payment.transaction_id || payment.session_id || "").startsWith('cs_') ? "Stripe Session ID" : "Reference ID"}
                      </p>
                      <p className="font-mono text-xs break-all text-primary">{payment.transaction_id || payment.session_id || "—"}</p>
                    </div>

                    {payment.amount_total && (
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                          {payment.payment_status === 'paid' ? "Amount Paid" : "Amount Attempted"}
                        </p>
                        <p className="font-semibold text-foreground">
                          {(payment.amount_total / 100).toFixed(2)} {payment.currency?.toUpperCase() || 'AED'}
                        </p>
                      </div>
                    )}

                    {/* Stripe Card Details */}
                    {payment.payment_details?.last4 && (
                      <div>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Card Info</p>
                        <p className="font-medium text-foreground capitalize">
                          {payment.payment_details.brand} •••• {payment.payment_details.last4}
                        </p>
                      </div>
                    )}

                    {payment.receipt_url && (
                      <div className="col-span-2">
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#D35400] text-[11px] font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download Receipt
                        </a>
                      </div>
                    )}

                    {/* Offline Specific Details */}
                    {payment.offline_details?.sender_bank && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Sender Bank</p>
                        <p className="font-medium">{payment.offline_details.sender_bank}</p>
                      </div>
                    )}
                    {payment.offline_details?.sender_name && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Account Name</p>
                        <p className="font-medium text-foreground">{payment.offline_details.sender_name}</p>
                      </div>
                    )}
                    {payment.offline_details?.collected_by && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Collected By</p>
                        <p className="font-medium">{payment.offline_details.collected_by}</p>
                      </div>
                    )}
                    {payment.offline_details?.receipt_no && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Receipt No</p>
                        <p className="font-medium">{payment.offline_details.receipt_no}</p>
                      </div>
                    )}
                    {payment.offline_details?.cheque_no && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Cheque No</p>
                        <p className="font-medium">{payment.offline_details.cheque_no}</p>
                      </div>
                    )}
                    {payment.offline_details?.issuing_bank && (
                      <div className="col-span-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Issuing Bank</p>
                        <p className="font-medium">{payment.offline_details.issuing_bank}</p>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Notes</p>
                      <p className="text-xs italic text-foreground/80">{payment.notes}</p>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewPaymentDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shipment Details Dialog */}
      <Dialog open={viewShipmentDialogOpen} onOpenChange={setViewShipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shipment Tracking</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {(order.tracking_number || (order as any).shipment_details) ? (
              <>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-semibold text-foreground">
                    {(order as any).shipment_details?.provider || "FedEx"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-b pb-2">
                  <span className="text-muted-foreground">Tracking Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-muted p-2 rounded break-all flex-1 text-sm">
                      {order.tracking_number || (order as any).shipment_details?.tracking_number || "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(order.tracking_number || (order as any).shipment_details?.tracking_number)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {order.updated_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-semibold text-foreground">
                      {formatDate(order.updated_at as any)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground">No tracking details recorded.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewShipmentDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
