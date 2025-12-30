"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface VendorTabsProps {
  userId: string;
}

export function VendorTabs({ userId }: VendorTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: "details",
      label: "Info",
      path: `/admin/vendors/${userId}`,
    },
    {
      id: "products",
      label: "Products",
      path: `/admin/vendors/${userId}/products`,
    },
    {
      id: "orders",
      label: "Orders",
      path: `/admin/vendors/${userId}/orders`,
    },
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
                "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

