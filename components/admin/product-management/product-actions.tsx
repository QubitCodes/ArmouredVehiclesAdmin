import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductActionsProps {
  onAddProduct: () => void;
}

export function ProductActions({ onAddProduct }: ProductActionsProps) {
  return (
    <div className="flex justify-end">
      <Button onClick={onAddProduct}>
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    </div>
  );
}
