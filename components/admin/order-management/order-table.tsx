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
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number | string | null): string => {
    if (amount === null || amount === undefined) return "—";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "—";
    return `${numAmount.toFixed(2)} AED`;
  };

  const formatStatus = (status?: string | null): string => {
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(180px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Customer
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Customer Email
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Tracking Number
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Total Amount
          </div>
          <div className="min-w-[100px] hidden text-sm font-semibold text-black md:block">
            Payment Status
          </div>
          <div className="min-w-[100px] hidden text-sm font-semibold text-black lg:block">
            Created Date
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
            <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(180px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3">
              <div className="text-foreground truncate">
                {order.user?.name || "—"}
              </div>
              <div className="text-foreground truncate">
                {order.user?.email || "—"}
              </div>
              <div>
                <span
                  className={`text-sm font-medium ${
                    order.status === "completed" || order.status === "delivered"
                      ? "text-green-600 dark:text-green-500"
                      : order.status === "pending"
                      ? "text-yellow-600 dark:text-yellow-500"
                      : order.status === "cancelled"
                      ? "text-red-600 dark:text-red-500"
                      : "text-orange-600 dark:text-orange-500"
                  }`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>
              <div className="font-medium text-foreground">
                {order.tracking_number || "—"}
              </div>
              <div className="text-foreground">
                {formatAmount(order.total_amount)}
              </div>
              <div className="hidden text-sm text-foreground md:block">
                <span
                  className={`font-medium ${
                    order.payment_status === "paid"
                      ? "text-green-600 dark:text-green-500"
                      : order.payment_status === "pending"
                      ? "text-yellow-600 dark:text-yellow-500"
                      : order.payment_status === "failed"
                      ? "text-red-600 dark:text-red-500"
                      : "text-foreground"
                  }`}
                >
                  {order.payment_status ? formatStatus(order.payment_status) : "—"}
                </span>
              </div>
              <div className="hidden text-sm text-foreground lg:block">
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

