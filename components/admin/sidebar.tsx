"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/admin/auth.service";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Admins",
    href: "/admin/admin-management",
    icon: Users,
  },
  {
    name: "Products",
    icon: Package,
    subItems: [
      {
        name: "Admin Products",
        href: "/admin/products/admin",
      },
      {
        name: "Vendor Products",
        href: "/admin/products/vendor",
      },
    ],
  },
  {
    name: "Orders",
    icon: ShoppingCart,
    subItems: [
      {
        name: "Admin Orders",
        href: "/admin/orders/admin",
      },
      {
        name: "Vendor Orders",
        href: "/admin/orders/vendor",
      },
    ],
  },
  {
    name: "Vendor Management",
    href: "/admin/vendors",
    icon: Store,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand Products if on a product page
    // Auto-expand Orders if on an orders page
    const expanded: string[] = [];
    if (pathname?.startsWith("/admin/products")) {
      expanded.push("Products");
    }
    if (pathname?.startsWith("/admin/orders")) {
      expanded.push("Orders");
    }
    return expanded;
  });

  const handleLogout = () => {
    authService.clearTokens();
    router.push("/admin/login");
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemExpanded = (itemName: string) => expandedItems.includes(itemName);

  const isSubItemActive = (href: string) => pathname === href;

  return (
    <div className="flex h-full w-64 flex-col border-r border-primary/20 bg-primary">
      <div className="flex h-16 items-center border-b border-primary/20 px-6">
        <h2 className="text-lg font-bold font-heading text-primary-foreground uppercase tracking-wide">
          ArmoredMart Admin
        </h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          // If item has sub-items, render as collapsible
          if (item.subItems) {
            const isExpanded = isItemExpanded(item.name);
            const hasActiveSubItem = item.subItems.some((subItem) =>
              isSubItemActive(subItem.href)
            );

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    hasActiveSubItem
                      ? "bg-muted text-foreground"
                      : "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-5 w-5",
                      hasActiveSubItem ? "text-foreground" : "text-primary-foreground"
                    )} />
                    <span className="text-left">{item.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className={cn(
                      "h-4 w-4",
                      hasActiveSubItem ? "text-foreground" : "text-primary-foreground"
                    )} />
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4",
                      hasActiveSubItem ? "text-foreground" : "text-primary-foreground"
                    )} />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary-foreground/20 pl-4">
                    {item.subItems.map((subItem) => {
                      const isActive = isSubItemActive(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                          )}
                        >
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular navigation item
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="border-t border-primary/20 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

