"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Plus } from "lucide-react";
import { authService } from "@/services/admin/auth.service";

export function ProductActions() {
  return (
    <div className="flex items-center gap-5 justify-end">
      <SearchInput placeholder="Search by name" />

      {authService.hasPermission("product.manage") && (
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      )}
    </div>
  );
}
