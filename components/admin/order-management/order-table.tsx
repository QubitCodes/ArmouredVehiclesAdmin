"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
      if (["completed", "delivered", "approved", "order_received"].includes(s)) return "text-green-600 dark:text-green-500";
      if (["pending", "pending_review", "pending_approval", "processing", "vendor_approved"].includes(s)) return "text-yellow-600 dark:text-yellow-500";
      if (["cancelled", "rejected", "failed", "vendor_rejected"].includes(s)) return "text-red-600 dark:text-red-500";
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

  const getAggregatedStatus = (statuses: string[]) => {
    const counts: Record<string, number> = {};
    statuses.forEach(s => {
        const key = formatStatusLabel(s);
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count, raw: statuses.find(s => formatStatusLabel(s) === status) || status }));
  };

  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
     const userStr = localStorage.getItem('user_details');
     if (userStr) {
         try {
             const user = JSON.parse(userStr);
              if (user && user.userType) {
                setUserRole(user.userType.toLowerCase());
            }
         } catch (e) {}
     }
  }, []);

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className={`grid items-center gap-4 px-4 py-3 bg-transparent ${userRole === 'vendor' ? 'grid-cols-[1fr_1fr_1fr_1.2fr_1fr_1fr_1fr]' : 'grid-cols-[1fr_1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr]'}`}>
          <div className="text-sm font-semibold text-black">Order ID</div>
          {userRole !== 'vendor' && (
              <div className="text-sm font-semibold text-black">Customer</div>
          )}
          <div className="text-sm font-semibold text-black">Total</div>
          <div className="text-sm font-semibold text-black">Commission</div>
          <div className="text-sm font-semibold text-black">Status</div>
          <div className="text-sm font-semibold text-black">Payment</div>
          <div className="text-sm font-semibold text-black">Shipment</div>
          <div className="text-sm font-semibold text-black">Date</div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {orders.map((order) => (
          <div
            key={order.id} // Representative ID
            onClick={() => router.push(`${basePath}/${order.id}`)}
            className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm cursor-pointer border rounded-lg"
          >
            <div className={`grid items-center gap-4 px-4 py-3 min-h-[80px] ${userRole === 'vendor' ? 'grid-cols-[1fr_1fr_1fr_1.2fr_1fr_1fr_1fr]' : 'grid-cols-[1fr_1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr]'}`}>
              
              {/* Grouped Order ID */}
              <div className="flex flex-col justify-center">
                 <span className="font-mono text-sm font-medium text-foreground">
                    {(order as any).order_group_id ? (order as any).order_group_id.slice(0, 8).toUpperCase() : (order.order_id || order.id.slice(0, 8))}
                 </span>
                 {(order as any).order_group_id && (
                     <span className="text-[10px] text-muted-foreground">
                        {(order as any).sub_order_count ? `Group ID (${(order as any).sub_order_count} Orders)` : 'Group ID'}
                     </span>
                 )}
              </div>

              {/* Customer - HIDDEN FOR VENDOR */}
              {userRole !== 'vendor' && (
                  <div className="flex flex-col justify-center gap-1">
                    <div className="font-medium text-sm text-foreground">{order.user?.name || "Guest"}</div>
                    <div className="text-xs text-muted-foreground">{order.user?.email || "—"}</div>
                  </div>
              )}

              {/* Total Amount (Aggregated) */}
              <div className="text-sm font-medium text-foreground">
                {formatAmount(order.total_amount, order.currency)}
              </div>

              {/* Commission (Aggregated) */}
               <div className="text-sm font-medium text-green-600">
                {order.admin_commission ? formatAmount(order.admin_commission, order.currency) : "—"}
              </div>

              {/* Statuses (Aggregated or Single) */}
              <div className="flex flex-col gap-1 items-start">
                {(order as any).status_summary ? (
                    getAggregatedStatus((order as any).status_summary).map((st, idx) => (
                        <span key={idx} className={`text-xs px-2 py-0.5 rounded-full bg-opacity-10 font-medium border whitespace-nowrap ${getStatusColor(st.raw, "order").replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${getStatusColor(st.raw, "order")}`}>
                            {st.status} ({st.count})
                        </span>
                    ))
                ) : (
                    <span className={`text-xs px-2 py-1 rounded-full bg-opacity-10 capitalize font-medium border ${getStatusColor(order.order_status, "order").replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${getStatusColor(order.order_status, "order")}`}>
                        {formatStatusLabel(order.order_status)}
                    </span>
                )}
              </div>
              
              <div className="text-sm text-foreground">
                 <span className={`capitalize ${getStatusColor(order.payment_status, "payment")}`}>
                  {formatStatusLabel(order.payment_status)}
                 </span>
              </div>
              <div className="text-sm text-foreground">
                 <span className={`capitalize ${getStatusColor(order.shipment_status, "shipment")}`}>
                  {formatStatusLabel(order.shipment_status)}
                 </span>
              </div>

              {/* Date */}
              <div className="text-sm text-muted-foreground">
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
