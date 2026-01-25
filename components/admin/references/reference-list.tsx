"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { ReferenceItem, referenceService } from "@/services/admin/reference.service";
import { ReferenceDialog } from "./reference-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Hardcoded list of supported reference types based on ReferenceController docs
import { BrandList } from "@/components/admin/brands/brand-list";

const REFERENCE_TYPES = [
  { id: "brands", label: "Product Brands" },
  { id: "nature-of-business", label: "Nature of Business" },
  { id: "end-use-markets", label: "End Use Markets" },
  { id: "license-types", label: "License Types" },
  // { id: "countries", label: "Countries" },
  { id: "vendor-categories", label: "Vendor Categories" },
  { id: "currencies", label: "Currencies" },
  // { id: "payment-methods", label: "Payment Methods" },
  { id: "financial-institutions", label: "Banks / Institutions" },
  { id: "proof-types", label: "Bank Proof Types" },
  { id: "verification-methods", label: "Verification Methods" },
  { id: "product-sizes", label: "Product Sizes" },
  { id: "product-colors", label: "Product Colors" },
  { id: "drive-types", label: "Drive Types" },
  { id: "dimension-units", label: "Dimension Units" },
  { id: "weight-units", label: "Weight Units" },
  // { id: "controlled-item-types", label: "Controlled Item Types" },
  { id: "pricing-terms", label: "Pricing Terms" },
  { id: "manufacturing-sources", label: "Manufacturing Sources" },
];

export function ReferenceList() {
  const [selectedType, setSelectedType] = useState(REFERENCE_TYPES[0].id);
  const [data, setData] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = async () => {
    if (selectedType === 'brands') return; // Handled by BrandList component
    setLoading(true);
    try {
      const items = await referenceService.getData(selectedType);
      setData(items);
    } catch (error) {
      toast.error("Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const handleEdit = (item: ReferenceItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await referenceService.deleteItem(selectedType, deleteId);
      toast.success("Item deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const columns: Column<ReferenceItem>[] = [
    {
      header: "Name / Value",
      accessorKey: "name",
      className: "font-medium"
    },
    {
      header: "Status",
      accessorKey: "is_active",
      render: (item) => (
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          item.is_active
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-500"
        )}>
          {item.is_active ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex bg-bg-light border rounded-lg overflow-hidden min-h-[600px]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10 p-4">
        <h3 className="font-semibold mb-4 px-2">Reference Tables</h3>
        <div className="space-y-1">
          {REFERENCE_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                selectedType === type.id
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedType === 'brands' ? (
          <BrandList />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {REFERENCE_TYPES.find(t => t.id === selectedType)?.label}
                </h2>
                <p className="text-muted-foreground text-sm">Manage values for this dropdown.</p>
              </div>
              <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <CustomTable
              data={data}
              columns={columns}
              gridCols="2fr 1fr 100px"
              isLoading={loading}
              emptyMessage="No items found in this list."
            />
          </>
        )}
      </div>

      <ReferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={selectedType}
        item={selectedItem}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              Action cannot be undone. Checks will be performed to ensure this value is not in use by products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
