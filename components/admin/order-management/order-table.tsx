"use client";

import { useRouter } from "next/navigation";
import { Order } from "@/services/admin/order.service";

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const router = useRouter();
  if (orders.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No orders found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-lg mb-1">
        <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(150px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Tracking Number
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Customer
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Total Amount
          </div>
          <div className="min-w-[100px] hidden text-sm font-semibold text-black md:block">
            Estimated Delivery
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black lg:block">
            Created Date
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => router.push(`/admin/orders/${order.id}`)}
            className="w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:shadow-sm cursor-pointer"
          >
            <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(150px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">
                {order.trackingNumber || "—"}
              </div>
              <div className="text-foreground truncate">
                {order.user?.name || order.customerName || order.customerEmail || "—"}
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
                  {order.status
                    ? order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)
                    : "Pending"}
                </span>
              </div>
              <div className="text-foreground">
                ${order.total 
                  ? parseFloat(order.total).toFixed(2)
                  : typeof order.totalAmount === 'number' 
                  ? order.totalAmount.toFixed(2) 
                  : parseFloat(String(order.totalAmount || '0')).toFixed(2)}
              </div>
              <div className="hidden text-sm text-foreground md:block">
                {order.estimatedDelivery 
                  ? new Date(order.estimatedDelivery).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </div>
              <div className="hidden text-sm text-foreground lg:block">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

