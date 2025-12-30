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
      label: "Vendor Details",
      path: `/admin/vendors/${userId}`,
    },
    {
      id: "products",
      label: "Vendor Products",
      path: `/admin/vendors/${userId}/products`,
    },
  ];

  const activeTab = tabs.find((tab) => pathname === tab.path)?.id || "details";

  return (
    <div className="border-b border-border">
      <nav className="flex gap-1" aria-label="Vendor navigation tabs">
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

