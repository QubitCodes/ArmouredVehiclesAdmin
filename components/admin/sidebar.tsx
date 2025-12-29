"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, LogOut } from "lucide-react";

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
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Vendors",
    href: "/admin/vendors",
    icon: Store,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    authService.clearTokens();
    router.push("/admin/login");
  };

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

