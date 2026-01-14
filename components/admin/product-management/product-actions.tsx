"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Plus } from "lucide-react";

export function ProductActions() {
  return (
    <div className="flex items-center gap-5 justify-end">
      <SearchInput placeholder="Search by name" />

      <Link href="/admin/products/new">
        <Button>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </Link>
    </div>
  );
}
