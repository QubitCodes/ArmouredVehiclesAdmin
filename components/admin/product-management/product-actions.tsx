"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Plus } from "lucide-react";
import { authService } from "@/services/admin/auth.service";

export function ProductActions() {
  const [canAddProduct, setCanAddProduct] = useState(false);

  useEffect(() => {
    setCanAddProduct(authService.hasPermission("product.manage"));
  }, []);

  return (
    <div className="flex items-center gap-5 justify-end">
      <SearchInput placeholder="Search by name" />

      {canAddProduct && (
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      )}
    </div>
  );
}
