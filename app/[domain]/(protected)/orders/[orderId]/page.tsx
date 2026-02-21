"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/admin/auth.service";
import { AxiosError } from "axios";
import { useMarkReadByEntity } from "@/hooks/admin/use-notifications";
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
  Download,
  Truck
} from "lucide-react";
import Image from "next/image";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/admin/order-management/use-order";
import { Select } from "@/components/ui/select";
import { useUpdateOrder } from "@/hooks/admin/order-management/use-update-order";
import { useUpdateOrderById } from "@/hooks/admin/order-management/use-update-order-by-id";
import { normalizeImageUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { InvoiceSection, InvoiceCommentModal } from "@/components/admin/invoices";
import { PickupScheduleDialog } from "@/components/admin/order-management/PickupScheduleDialog";
import { RateCalculatorDialog } from "@/components/admin/order-management/RateCalculatorDialog";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const domain = (params?.domain as string) || "admin";

  const { data: order, isLoading, error } = useOrder(orderId);

  const { mutate: updateOrder, mutateAsync: updateOrderAsync, isPending: isUpdating } =
    useUpdateOrder(orderId);
  const { mutate: updateOrderById, mutateAsync: updateOrderByIdAsync } = useUpdateOrderById();
  const queryClient = useQueryClient();

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

  // Auto-mark notifications as read when opening this order
  // Some notifications store entity_id = order_group_id (8-digit short ID from checkout),
  // others store entity_id = order UUID (from status changes). Mark both.
  const markReadByEntity = useMarkReadByEntity();
  useEffect(() => {
    if (orderId) {
      markReadByEntity.mutate({ entityType: 'order', entityId: orderId });
    }
    if (order?.order_group_id && order.order_group_id !== orderId) {
      markReadByEntity.mutate({ entityType: 'order', entityId: order.order_group_id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, order?.order_group_id]);

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

  // FedEx Pickup Dialog State
  const [isFedExPickupOpen, setIsFedExPickupOpen] = useState(false);
  const [pendingShipmentStatus, setPendingShipmentStatus] = useState<string | null>(null);
  const [pickupTargetOrderId, setPickupTargetOrderId] = useState<string | null>(null);

  // Calculate weight for the target order (sub-order or main)
  const pickupOrderWeight = useMemo(() => {
    if (!order) return 1;
    let targetItems: any[] = [];

    // If pickupTargetOrderId is set and different from main order, try to find sub-order items
    if (pickupTargetOrderId && pickupTargetOrderId !== order.id) {
      const subOrder = order.grouped_orders?.find(o => o.id === pickupTargetOrderId);
      if (subOrder && subOrder.items) {
        targetItems = subOrder.items;
      } else if (subOrder && subOrder.vendor_id) {
        // Fallback: filter items by vendor
        targetItems = order.items?.filter(i => (i.product as any)?.vendor?.id === subOrder.vendor_id) || [];
      }
    }

    // If no target items found yet (or main order), use all items
    if (targetItems.length === 0) {
      targetItems = order.items || [];
    }

    if (targetItems.length === 0) return 1;

    return targetItems.reduce((sum, item) => {
      const w = Number((item.product as any)?.weight_value || 1);
      return sum + (w * item.quantity);
    }, 0);
  }, [order, pickupTargetOrderId]);

  // Calculate package count (total quantity of items)
  const pickupOrderPackageCount = useMemo(() => {
    if (!order) return 1;
    let targetItems: any[] = [];

    if (pickupTargetOrderId && pickupTargetOrderId !== order.id) {
      const subOrder = order.grouped_orders?.find(o => o.id === pickupTargetOrderId);
      if (subOrder && subOrder.items) {
        targetItems = subOrder.items;
      } else if (subOrder && subOrder.vendor_id) {
        targetItems = order.items?.filter(i => (i.product as any)?.vendor?.id === subOrder.vendor_id) || [];
      }
    }

    if (targetItems.length === 0) {
      targetItems = order.items || [];
    }

    if (targetItems.length === 0) return 1;

    return targetItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [order, pickupTargetOrderId]);

  const handlePaymentStatusChange = (newStatus: string) => {
    if (newStatus === "paid") {
      setIsPaymentDialogOpen(true);
    } else {
      // Update ALL sub-orders if grouped
      const groupedOrders: any[] = (order as any).grouped_orders || [];
      if (groupedOrders.length > 0) {
        groupedOrders.forEach(o => {
          updateOrderById({ id: o.id || o.order_id, data: { payment_status: newStatus as any } });
        });
      } else {
        updateOrder({ payment_status: newStatus as any });
      }
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

    // Delay invoice query refetch to allow backend to generate invoices after payment
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['invoices', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }, 2000);

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
    provider: "",
  });

  // FedEx Pickup Dialog State (Moved up for clarity, but keeping here for replace context if needed)
  // const [isFedExPickupOpen, setIsFedExPickupOpen] = useState(false);
  // const [pendingShipmentStatus, setPendingShipmentStatus] = useState<string | null>(null);

  /**
   * TODO: Remove isManualShippingOrder once FedEx multi-country account support is enabled.
   * Checks if a sub-order requires manual shipping (both vendor and buyer outside UAE).
   * Uses the delivery address country from shipment_details (NOT the buyer's registered profile).
   * Falls back to FedEx (returns false) if country data is unavailable.
   */
  const isManualShippingOrder = (subOrder: any): boolean => {
    /** Normalize country to ISO 2-letter code */
    const normalize = (val: string): string => {
      const v = (val || '').trim().toUpperCase();
      if (v.length === 2) return v;
      const map: Record<string, string> = {
        'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE',
        'INDIA': 'IN', 'UNITED STATES': 'US', 'USA': 'US',
        'UNITED KINGDOM': 'GB', 'UK': 'GB',
        'SAUDI ARABIA': 'SA', 'KSA': 'SA',
        'QATAR': 'QA', 'OMAN': 'OM', 'KUWAIT': 'KW',
        'BAHRAIN': 'BH', 'PAKISTAN': 'PK',
      };
      return map[v] || v;
    };

    const vendorCountry = normalize(subOrder.vendor?.profile?.country || subOrder.vendor?.country || 'AE');

    // Buyer country = delivery address from shipment_details, NOT profile registered country
    // shipment_details stores the full Address record (including country) at order creation
    const shipDetails = typeof subOrder.shipment_details === 'string'
      ? (() => { try { return JSON.parse(subOrder.shipment_details); } catch { return {}; } })()
      : (subOrder.shipment_details || {});
    const buyerCountry = normalize(shipDetails.country || 'AE');

    const isManual = vendorCountry !== 'AE' && buyerCountry !== 'AE';
    if (isManual) {
      console.log(`[ManualShipping] vendor=${vendorCountry}, buyer(delivery)=${buyerCountry} → manual shipping`);
    }
    return isManual;
  };

  const handleShipmentStatusChange = (newStatus: string) => {
    // TODO: Remove manual shipping check once FedEx multi-country account support is enabled
    const manualShipping = isManualShippingOrder(order);

    if (newStatus === "shipped") {
      if (manualShipping) {
        // Manual shipping: open tracking dialog instead of FedEx pickup
        setPickupTargetOrderId(orderId);
        setIsShipmentDialogOpen(true);
      } else {
        // FedEx: open pickup schedule dialog
        setPendingShipmentStatus(newStatus);
        setIsFedExPickupOpen(true);
      }
    } else if (newStatus === "processing" && manualShipping) {
      // Manual shipping: just update status, no FedEx pickup needed
      updateOrder({ shipment_status: newStatus as any });
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

    // Check if we are targeting a sub-order
    if (pickupTargetOrderId && pickupTargetOrderId !== orderId) {
      updateOrderById({
        id: pickupTargetOrderId,
        data: {
          shipment_status: "shipped",
          shipment_details: JSON.stringify({
            tracking_number: shipmentForm.tracking_number,
            provider: shipmentForm.provider,
          })
        }
      });
    } else {
      updateOrder({
        shipment_status: "shipped",
        shipment_details,
      });
    }
    setIsShipmentDialogOpen(false);
    setShipmentForm({ tracking_number: "", provider: "FedEx" });
  };

  /**
   * Handle successful FedEx pickup scheduling
   */
  const handleFedExPickupSuccess = (result: {
    trackingNumber: string;
    labelUrl: string;
    pickupConfirmation?: string;
  }) => {
    // Refetch order data to get updated shipment info
    // The order will be updated by the backend
    toast.success(`Pickup scheduled! Tracking: ${result.trackingNumber}`);
    setPendingShipmentStatus(null);
    // Invalidate order query to refetch fresh data (no page reload needed)
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  };

  // Invoice Comment Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingStatusOrderId, setPendingStatusOrderId] = useState<string | null>(null);

  const handleOrderStatusChange = (newStatus: string) => {
    if (newStatus === 'approved' || newStatus === 'approved_controlled') {
      setPendingStatus(newStatus);
      setIsInvoiceModalOpen(true);
    } else {
      updateOrder({ order_status: newStatus as any });
    }
  };

  const handleSubOrderStatusChange = (subOrderId: string, newStatus: string) => {
    if (newStatus === 'approved' || newStatus === 'approved_controlled') {
      setPendingStatus(newStatus);
      setPendingStatusOrderId(subOrderId);
      setIsInvoiceModalOpen(true);
    } else {
      updateOrderById({ id: subOrderId, data: { order_status: newStatus as any } });
    }
  };

  const handleSubOrderShipmentChange = (subOrderId: string, newStatus: string) => {
    // Find the sub-order to check for manual shipping
    const subOrder = (order as any)?.grouped_orders?.find((o: any) => o.id === subOrderId) || order;



    const manualShipping = isManualShippingOrder(subOrder);

    if (newStatus === "shipped" && manualShipping) {
      // Manual shipping: open tracking dialog instead of FedEx pickup
      setPickupTargetOrderId(subOrderId);
      setIsShipmentDialogOpen(true);
    } else if (newStatus === "processing") {
      if (manualShipping) {
        // Manual shipping: just update status, no FedEx pickup needed
        updateOrderById({ id: subOrderId, data: { shipment_status: newStatus as any } });
      } else {
        // FedEx: open pickup schedule dialog
        setPickupTargetOrderId(subOrderId);
        setPendingShipmentStatus(newStatus);
        setIsFedExPickupOpen(true);
      }
    } else {
      updateOrderById({ id: subOrderId, data: { shipment_status: newStatus as any } });
    }
  };

  const handleInvoiceCommentConfirm = async (comments: string | null) => {
    if (pendingStatus) {
      const targetId = pendingStatusOrderId || orderId;
      try {
        if (pendingStatusOrderId) {
          await updateOrderByIdAsync({ id: targetId, data: { order_status: pendingStatus as any, invoice_comments: comments } });
        } else {
          await updateOrderAsync({
            order_status: pendingStatus as any,
            invoice_comments: comments
          } as any);
        }
        // Invalidate both order and invoices to ensure UI is fresh
        queryClient.invalidateQueries({ queryKey: ['invoices', orderId] });
      } catch (error) {
        console.error("Failed to update order status", error);
      }
      setPendingStatus(null);
      setPendingStatusOrderId(null);
    }
  };

  // View Details Dialog State
  const [viewPaymentDialogOpen, setViewPaymentDialogOpen] = useState(false);
  const [viewShipmentDialogOpen, setViewShipmentDialogOpen] = useState(false);
  const [viewingShipmentOrder, setViewingShipmentOrder] = useState<any>(null); // Track which order to view shipment for
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);

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
      case "approved_controlled":
        return "text-green-600 dark:text-green-500";
      case "pending_review":
      case "pending_approval":
      case "order_received":
        return "text-yellow-600 dark:text-yellow-500";
      case "rejected":
      case "admin_rejected":
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
            {(() => {
              const raw = (order as any).transaction_details;
              if (!raw) return null;

              let payments: any[] = [];
              try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                payments = Array.isArray(parsed) ? parsed : [parsed];
              } catch (e) {
                return null;
              }

              const hasPaid = payments.some(p => p && p.payment_status === 'paid');

              // Hide button if not super_admin and no successful payments
              if (userRole !== 'super_admin' && !hasPaid) return null;

              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs h-8"
                  onClick={() => setViewPaymentDialogOpen(true)}
                >
                  <Info className="h-3.5 w-3.5 mr-2" />
                  View Details
                </Button>
              );
            })()}
          </CardContent>
        </Card>

        {/* Invoices Section - Moved to grid */}
        <InvoiceSection orderId={orderId} userRole={userRole} className="col-span-2" />
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
                <div className="bg-muted/50 px-6 py-3 flex flex-row items-start justify-between gap-4">

                  <div className="flex flex-col items-start gap-1.5">
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

                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Sold by:</span>
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

                  <div className="flex flex-col items-end gap-2">
                    {/* Order Status Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground text-right w-16">Status</span>
                      <Select
                        value={subOrder.order_status || "order_received"}
                        onChange={(e) => handleSubOrderStatusChange(subOrder.id, e.target.value)}
                        disabled={isUpdating || roleLoading || (!canManageOrders && userRole !== 'vendor') || (userRole === 'vendor' && subOrder.order_status !== 'order_received')}
                        className="h-8 text-xs w-[140px]"
                      >
                        {roleLoading ? (
                          <option disabled>Loading options...</option>
                        ) : userRole === 'vendor' ? (
                          <>
                            <option value="order_received">Order Received</option>
                            {order.payment_status === 'paid' && (
                              <option value="approved">Approve Order</option>
                            )}
                            <option value="rejected">Reject Order</option>
                            <option value="admin_rejected">Admin Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        ) : (
                          <>
                            <option value="order_received">Order Received</option>
                            {(authService.hasPermission("order.approve")) && order.payment_status === 'paid' && (
                              <option value="approved">Approved</option>
                            )}
                            <option value="rejected">Rejected</option>
                            <option value="admin_rejected">Admin Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                      </Select>
                    </div>

                    {/* Shipment Status Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground text-right w-16">Shipment</span>
                      <div className="flex items-center gap-2">
                        <Select
                          value={subOrder.shipment_status || "pending"}
                          onChange={(e) => handleSubOrderShipmentChange(subOrder.id, e.target.value)}
                          disabled={
                            isUpdating ||
                            (userRole !== 'vendor' && !canManageOrders) ||
                            (userRole === 'vendor' && (
                              order.payment_status !== 'paid' ||
                              !['approved', 'approved_controlled'].includes(subOrder.order_status)
                            ))
                          }
                          className="h-8 text-xs w-[140px]"
                        >
                          <option value="pending">Pending</option>
                          {!isManualShippingOrder(subOrder) && (
                            <option value="processing">Processing (Schedule Pickup)</option>
                          )}
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="returned">Returned</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                        {/* Shipment Details Button */}
                        {((['processing', 'shipped', 'delivered'].includes(subOrder.shipment_status)) &&
                          (subOrder.tracking_number || (subOrder as any).shipment_details)) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setViewingShipmentOrder(subOrder);
                                setViewShipmentDialogOpen(true);
                              }}
                              title="View Shipment Details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </div>
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

                        {/* Product Info & Pricing */}
                        <div className="flex-grow flex flex-col md:flex-row md:items-start justify-between gap-4 min-w-0">
                          {/* Left Side: Product Name & SKU */}
                          <div className="min-w-0">
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

                          {/* Right Side: Financial Details */}
                          <div className="flex flex-wrap items-center md:justify-end gap-x-4 gap-y-2 text-right">
                            {/* Price Breakdown (Base + Platform Fees) - Grouped with Brackets for Admins */}
                            {(() => {
                              const basePrice = Number(item.base_price) || Number(item.product?.base_price) || Number(item.price);
                              const unitPrice = Number(item.price);
                              const commission = unitPrice - basePrice;

                              const basePriceBlock = (
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {userRole === 'vendor' ? 'Price' : 'Base Price'}
                                  </span>
                                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                                    {order.currency || "AED"} {basePrice.toFixed(2)}
                                  </span>
                                </div>
                              );

                              if (userRole !== 'vendor' && commission > 0) {
                                return (
                                  <div className="flex items-center gap-2 px-2.5 py-1.5 border border-dashed border-muted/30 rounded-lg bg-muted/5">
                                    <span className="text-3xl font-extralight text-muted-foreground/30 antialiased -mt-1 select-none">[</span>
                                    {basePriceBlock}
                                    <span className="text-xl font-bold text-muted-foreground/30 mx-0.5">+</span>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Platform Fees
                                      </span>
                                      <span className="text-sm font-semibold text-red-500 whitespace-nowrap">
                                        {order.currency || "AED"} {commission.toFixed(2)}
                                      </span>
                                    </div>
                                    <span className="text-3xl font-extralight text-muted-foreground/30 antialiased -mt-1 select-none">]</span>
                                  </div>
                                );
                              }

                              return basePriceBlock;
                            })()}
                            <span className="text-xl font-bold text-muted-foreground/20 mx-0.5">×</span>
                            {/* Quantity */}
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Quantity
                              </span>
                              <span className="text-sm font-semibold text-foreground">{item.quantity}
                              </span>
                            </div>

                            {/* Total (Line Total) */}
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Total
                              </span>
                              <span className="text-base font-bold text-primary">
                                {order.currency || "AED"}{" "}
                                {(
                                  Number(userRole === 'vendor' ? (Number(item.base_price) || Number(item.product?.base_price) || Number(item.price)) : item.price) * item.quantity
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
                      <span className="font-medium">
                        {order.currency || "AED"}{" "}
                        {(
                          parseFloat(subOrder.total_amount || "0") -
                          parseFloat(subOrder.vat_amount || "0") -
                          parseFloat(subOrder.total_shipping || "0") -
                          parseFloat(subOrder.total_packing || "0")
                        ).toFixed(2)}
                      </span>
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

                    <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold text-foreground">
                      <span>Grand Total:</span>
                      <span className="text-primary">
                        {order.currency || "AED"} {parseFloat(subOrder.total_amount || "0").toFixed(2)}
                      </span>
                    </div>

                    {/* Show Admin Earning Only for Admin */}
                    {userRole !== 'vendor' && subOrder.calculated_admin_commission && parseFloat(subOrder.calculated_admin_commission) > 0 && (
                      <div className="bg-primary/5 p-2 rounded-md mt-2 flex justify-between text-xs font-semibold text-primary/80 border border-primary/10">
                        <span>Admin Commission Content:</span>
                        <span>{order.currency || "AED"} {parseFloat(subOrder.calculated_admin_commission).toFixed(2)}</span>
                      </div>
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

                // RESTRICTION: Only super_admin sees non-paid attempts. 
                // Others only see 'paid' attempts.
                if (userRole !== 'super_admin') {
                  payments = payments.filter(p => p.payment_status === 'paid');
                }
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
                      {userRole === 'super_admin' ? (idx === 0 ? "Latest Attempt" : `Previous Attempt (${sortedPayments.length - idx})`) : `Payment Entry`}
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
      <Dialog open={viewShipmentDialogOpen} onOpenChange={(open) => {
        setViewShipmentDialogOpen(open);
        if (!open) setViewingShipmentOrder(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shipment Tracking</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {(() => {
              const targetOrder = viewingShipmentOrder || order;
              const hasShipment = targetOrder.tracking_number || (targetOrder as any).shipment_details;

              if (!hasShipment) {
                return <p className="text-center text-muted-foreground">No tracking details recorded.</p>;
              }

              const sDetails = (targetOrder as any).shipment_details?.customer_shipment || (targetOrder as any).shipment_details;

              return (
                <>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-semibold text-foreground">
                      {(targetOrder as any).shipment_details?.provider || "FedEx"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 border-b pb-2">
                    <span className="text-muted-foreground">Tracking Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-muted p-2 rounded break-all flex-1 text-sm">
                        {targetOrder.tracking_number || sDetails?.tracking_number || "—"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(targetOrder.tracking_number || sDetails?.tracking_number)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Label URL */}
                  {((targetOrder as any).label_url || sDetails?.label_url) && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Shipping Label:</span>
                      <a
                        href={(targetOrder as any).label_url || sDetails?.label_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    </div>
                  )}
                  {/* Pickup Confirmation */}
                  {sDetails?.pickup_confirmation && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Pickup Confirmation:</span>
                      <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {sDetails.pickup_confirmation}
                      </span>
                    </div>
                  )}
                  {/* Pickup Date */}
                  {sDetails?.pickup_date && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-muted-foreground">Pickup Date:</span>
                      <span className="font-semibold text-foreground">
                        {sDetails.pickup_date}
                      </span>
                    </div>
                  )}
                  {targetOrder.updated_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-semibold text-foreground">
                        {formatDate(targetOrder.updated_at as any)}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setViewShipmentDialogOpen(false);
              setViewingShipmentOrder(null);
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InvoiceCommentModal
        open={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleInvoiceCommentConfirm}
        isLoading={isUpdating}
      />

      {/* TODO: Remove manual shipment dialog once FedEx multi-country account support is enabled */}
      {/* Manual Shipment Confirmation Dialog — for non-AE to non-AE orders */}
      <Dialog open={isShipmentDialogOpen} onOpenChange={setIsShipmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Mark as Shipped
            </DialogTitle>
            <DialogDescription>
              Enter the shipping details for this order. The tracking information will be shared with the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tracking_number">Tracking Number <span className="text-destructive">*</span></Label>
              <Input
                id="tracking_number"
                placeholder="e.g. 1234567890"
                value={shipmentForm.tracking_number}
                onChange={(e) =>
                  setShipmentForm((prev) => ({
                    ...prev,
                    tracking_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_provider">Shipping Provider <span className="text-destructive">*</span></Label>
              <Input
                id="shipping_provider"
                list="shipping_provider_suggestions"
                placeholder="e.g. FedEx, DHL, Aramex"
                value={shipmentForm.provider}
                onChange={(e) =>
                  setShipmentForm((prev) => ({ ...prev, provider: e.target.value }))
                }
              />
              <datalist id="shipping_provider_suggestions">
                <option value="FedEx" />
                <option value="BlueDart" />
                <option value="Aramex" />
                <option value="DHL" />
                <option value="DTDC" />
                <option value="UPS" />
                <option value="India Post" />
              </datalist>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsShipmentDialogOpen(false);
                setShipmentForm({ tracking_number: "", provider: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShipmentConfirm}
              disabled={!shipmentForm.tracking_number.trim() || !shipmentForm.provider.trim()}
            >
              Confirm Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FedEx Pickup Schedule Dialog */}
      <PickupScheduleDialog
        open={isFedExPickupOpen}
        onClose={() => {
          setIsFedExPickupOpen(false);
          setPendingShipmentStatus(null);
        }}
        orderId={orderId}
        currentStatus={order.shipment_status || "pending"}
        targetStatus={pendingShipmentStatus || "processing"}
        defaultWeight={pickupOrderWeight}
        defaultPackageCount={pickupOrderPackageCount}
        onSuccess={handleFedExPickupSuccess}
      />

      {/* FedEx Rate Calculator Dialog */}
      <RateCalculatorDialog
        open={isRateCalculatorOpen}
        onClose={() => setIsRateCalculatorOpen(false)}
        orderId={orderId}
        orderCurrency={order.currency}
      />
    </div>
  );
}
