"use client";

import { useRouter } from "next/navigation";
import { Order } from "@/services/admin/order.service";

interface OrderTableProps {
  orders: Order[];
  basePath?: string;
}

type StatusType = "success" | "warning" | "error" | "info" | "default";

const statusStyles: Record<StatusType, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function OrderTable({ orders, basePath = "/admin/orders" }: OrderTableProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
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

  const getOrderStatusType = (status?: string): StatusType => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (["completed", "delivered", "approved"].includes(s)) return "success";
    if (["pending", "pending_review", "pending_approval", "processing"].includes(s)) return "warning";
    if (["cancelled", "rejected", "failed"].includes(s)) return "error";
    if (["shipped", "in_transit"].includes(s)) return "info";
    return "default";
  };

  const getPaymentStatusType = (status?: string | null): StatusType => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (["paid", "completed", "success"].includes(s)) return "success";
    if (["pending", "awaiting"].includes(s)) return "warning";
    if (["failed", "declined", "refunded"].includes(s)) return "error";
    return "default";
  };

  const getShipmentStatusType = (status?: string | null): StatusType => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (["delivered", "completed"].includes(s)) return "success";
    if (["pending", "processing", "ready"].includes(s)) return "warning";
    if (["shipped", "in_transit", "out_for_delivery"].includes(s)) return "info";
    if (["failed", "returned", "cancelled"].includes(s)) return "error";
    return "default";
  };

  const StatusBadge = ({ status, type }: { status: string; type: StatusType }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[type]}`}
    >
      {status}
    </span>
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
              Customer
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
              Email
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
              Total
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
              Status
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
              Payment
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
              Shipment
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => router.push(`${basePath}/${order.id}`)}
              className="border-b bg-bg-light hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-medium text-foreground truncate block max-w-[150px]">
                  {order.user?.name || "—"}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-muted-foreground truncate block max-w-[180px]">
                  {order.user?.email || "—"}
                </span>
              </td>
            
              <td className="py-3 px-4 text-right">
                <span className="text-sm font-medium text-foreground">
                  {formatAmount(order.total_amount, order.currency)}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {order.status ? (
                  <StatusBadge
                    status={formatStatusLabel(order.status)}
                    type={getOrderStatusType(order.status)}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {order.payment_status ? (
                  <StatusBadge
                    status={formatStatusLabel(order.payment_status)}
                    type={getPaymentStatusType(order.payment_status)}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {order.shipment_status ? (
                  <StatusBadge
                    status={formatStatusLabel(order.shipment_status)}
                    type={getShipmentStatusType(order.shipment_status)}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
