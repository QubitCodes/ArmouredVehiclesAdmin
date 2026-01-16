"use client";

import { useRouter } from "next/navigation";
import { Order } from "@/services/admin/order.service";

interface OrderTableProps {
  orders: Order[];
  basePath?: string;
}

export function OrderTable({ orders, basePath = "/admin/orders" }: OrderTableProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        No orders found.
      </div>
    );
  }

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number | string | null, currency?: string): string => {
    if (amount === null || amount === undefined) return "—";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "—";
    return `${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || "AED"}`;
  };

  const formatStatusLabel = (status?: string | null): string => {
    if (!status) return "—";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusColor = (status?: string | null, type: "order" | "payment" | "shipment" = "order"): string => {
    if (!status) return "text-foreground";
    const s = status.toLowerCase();

    if (type === "order") {
      if (["completed", "delivered", "approved"].includes(s)) return "text-green-600 dark:text-green-500";
      if (["pending", "pending_review", "pending_approval", "processing"].includes(s)) return "text-yellow-600 dark:text-yellow-500";
      if (["cancelled", "rejected", "failed"].includes(s)) return "text-red-600 dark:text-red-500";
      if (["shipped", "in_transit"].includes(s)) return "text-blue-600 dark:text-blue-500";
    }

    if (type === "payment") {
      if (["paid", "completed", "success"].includes(s)) return "text-green-600 dark:text-green-500";
      if (["pending", "awaiting"].includes(s)) return "text-yellow-600 dark:text-yellow-500";
      if (["failed", "declined", "refunded"].includes(s)) return "text-red-600 dark:text-red-500";
    }

    if (type === "shipment") {
      if (["delivered", "completed"].includes(s)) return "text-green-600 dark:text-green-500";
      if (["pending", "processing", "ready"].includes(s)) return "text-yellow-600 dark:text-yellow-500";
      if (["shipped", "in_transit", "out_for_delivery"].includes(s)) return "text-blue-600 dark:text-blue-500";
      if (["failed", "returned", "cancelled"].includes(s)) return "text-red-600 dark:text-red-500";
    }

    return "text-foreground";
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Customer
          </div>
          <div className="min-w-[160px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Total
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Payment
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Shipment
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Created
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => router.push(`${basePath}/${order.id}`)}
            className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm cursor-pointer"
          >
            <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">
                {order.user?.name || "—"}
              </div>
              <div className="text-foreground">{order.user?.email || "—"}</div>
              <div className="text-foreground">
                {formatAmount(order.total_amount, order.currency)}
              </div>
              <div className="text-foreground">
                <span className={`text-sm capitalize ${getStatusColor(order.order_status, "order")}`}>
                  {formatStatusLabel(order.order_status)}
                </span>
              </div>
              <div className="text-foreground">
                <span className={`text-sm capitalize ${getStatusColor(order.payment_status, "payment")}`}>
                  {formatStatusLabel(order.payment_status)}
                </span>
              </div>
              <div className="text-foreground">
                <span className={`text-sm capitalize ${getStatusColor(order.shipment_status, "shipment")}`}>
                  {formatStatusLabel(order.shipment_status)}
                </span>
              </div>
              <div className="text-foreground">
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
