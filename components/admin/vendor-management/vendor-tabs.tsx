"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Info, Package, ShoppingCart } from "lucide-react";

interface VendorTabsProps {
  userId: string;
}

import { authService } from "@/services/admin/auth.service";
import { useEffect, useState } from "react";

interface VendorTabsProps {
  userId: string;
}

export function VendorTabs({ userId }: VendorTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [canViewOrders, setCanViewOrders] = useState(false);

  useEffect(() => {
    // Check if user has ANY of the order permissions
    const hasOrderPerm = authService.hasAnyPermission([
      'order.view',
      'order.manage',
      'order.approve',
      'order.controlled.approve'
    ], true); // Allow vendors to see their own orders (passed as TRUE for allowVendor)

    setCanViewOrders(hasOrderPerm);
  }, []);

  const tabs = [
    {
      id: "details",
      label: "Info",
      path: `/admin/vendors/${userId}`,
      icon: Info,
    },
    {
      id: "products",
      label: "Products",
      path: `/admin/vendors/${userId}/products`,
      icon: Package,
    },
    ...(canViewOrders ? [{
      id: "orders",
      label: "Orders",
      path: `/admin/vendors/${userId}/orders`,
      icon: ShoppingCart,
    }] : []),
  ];

  // Sort tabs by path length (longest first) to match more specific paths first
  const sortedTabs = [...tabs].sort((a, b) => b.path.length - a.path.length);
  const activeTab = sortedTabs.find((tab) => pathname === tab.path || pathname.startsWith(tab.path + "/"))?.id || "details";

  return (
    <div className="border-b border-border">
      <nav className="flex gap-4" aria-label="Vendor navigation tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

