"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface VendorProductActionsProps {
  onAddProduct?: () => void;
}

export function VendorProductActions({ onAddProduct }: VendorProductActionsProps) {
  return (
    <div className="flex justify-end">
      <Link href="/vendor/products/new">
        <Button>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </Link>
    </div>
  );
}

