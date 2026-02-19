"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Info } from "lucide-react";
import { authService } from "@/services/admin/auth.service";
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
import { useCountries } from "@/hooks/vendor/dashboard/use-countries";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";

// Hardcoded list of supported reference types based on ReferenceController docs
import { BrandList } from "@/components/admin/brands/brand-list";
import { VatRulesPanel } from "@/components/admin/references/vat-rules-panel";
import { PlatformFeesPanel } from "@/components/admin/references/platform-fees-panel";

const REFERENCE_TYPES = [
  { id: "brands", label: "Product Brands" },
  { id: "nature-of-business", label: "Nature of Business" },
  { id: "end-use-markets", label: "End Use Markets" },
  { id: "license-types", label: "License Types" },
  // { id: "countries", label: "Countries" },
  { id: "vendor-categories", label: "Vendor Categories" },
  // { id: "currencies", label: "Currencies" },
  // { id: "payment-methods", label: "Payment Methods" },
  { id: "financial-institutions", label: "Banks / Institutions" },
  // { id: "proof-types", label: "Bank Proof Types" },
  // { id: "verification-methods", label: "Verification Methods" },
  // { id: "product-sizes", label: "Product Sizes" },
  // { id: "product-colors", label: "Product Colors" },
  // { id: "drive-types", label: "Drive Types" },
  // { id: "dimension-units", label: "Dimension Units" },
  // { id: "weight-units", label: "Weight Units" },
  { id: "controlled-item-types", label: "Controlled Item Types" },
  // { id: "pricing-terms", label: "Pricing Terms" },
  // { id: "manufacturing-sources", label: "Manufacturing Sources" },
  { id: "shipping-types", label: "Shipping Types" },
  { id: "vat-rules", label: "VAT Rules" },
  { id: "platform-fees", label: "Platform Fees" },
];

export function ReferenceList() {
  const [selectedType, setSelectedType] = useState(REFERENCE_TYPES[0].id);
  const [data, setData] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const { data: countries = [] } = useCountries();

  /** Only super_admin can delete reference items */
  const isSuperAdmin = useMemo(() => {
    const user = authService.getUserDetails();
    return user?.userType === 'super_admin';
  }, []);

  const loadData = async () => {
    if (selectedType === 'brands' || selectedType === 'vat-rules' || selectedType === 'platform-fees') return; // Handled by dedicated components
    setLoading(true);
    try {
      const items = await referenceService.getData(selectedType);
      setData(items);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over?.id);

      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData); // Optimistic update

      // Prepare payload: map new index to display_order (1-based)
      const reorderPayload = newData.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      try {
        await referenceService.reorderItems(selectedType, reorderPayload);
        toast.success("Order updated");
        // Force reload to ensure DB sync
        loadData();
      } catch (error) {
        toast.error("Failed to update order");
        loadData(); // Revert on failure
      }
    }
  };

  // Sortable Row Component moved outside to prevent re-renders

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
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<Column<ReferenceItem>[]>(() => [
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
    ...(selectedType === 'financial-institutions' ? [{
      header: "Country",
      render: (item: ReferenceItem) => {
        const country = countries.find(c => c.value === item.country_code);
        return (
          <div className="flex items-center gap-2">
            <span>{country?.flag}</span>
            <span className="truncate">{country?.label || item.country_code}</span>
          </div>
        );
      }
    }] : []),
    {
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {isSuperAdmin && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [selectedType, countries, isSuperAdmin]);

  return (
    <div>
      {/* Critical data warning note — shown to non-super-admin users */}
      {!isSuperAdmin && (
        <div className="flex gap-3 items-start p-4 mb-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            As these data are critical to the site functionality, records cannot be deleted once added. To remove any records safely, please contact the Tech Support team.
          </p>
        </div>
      )}

      <div className="flex bg-bg-light border rounded-lg overflow-hidden min-h-[600px]">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/10 p-4">
          <h3 className="font-semibold mb-4 px-2">Platform Settings</h3>
          <div className="space-y-1">
            {REFERENCE_TYPES
              .filter(type => isSuperAdmin || (type.id !== 'vat-rules' && type.id !== 'platform-fees'))
              .map(type => (
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
          ) : selectedType === 'vat-rules' ? (
            <VatRulesPanel />
          ) : selectedType === 'platform-fees' ? (
            <PlatformFeesPanel />
          ) : (
            <>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {REFERENCE_TYPES.find(t => t.id === selectedType)?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm">Manage values for this dropdown.</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedType === 'financial-institutions' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Filter by Country:</span>
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="bg-background border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="all">All Countries</option>
                        {Array.from(new Set(data.map(item => item.country_code).filter(Boolean)))
                          .map(code => {
                            const country = countries.find(c => c.value === code);
                            return (
                              <option key={code} value={code}>
                                {country?.flag} {country?.label || code}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}
                  <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              </div>

              {selectedType === 'shipping-types' ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="border rounded-md">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                          <th className="h-12 px-4 w-[50px]"></th>
                          <th className="h-12 px-4 w-[80px]">Sl No</th>
                          <th className="h-12 px-4">Name / Value</th>
                          <th className="h-12 px-4 w-[100px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        <SortableContext
                          items={data.map(i => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {data.map((item, index) => (
                            <SortableRow
                              key={item.id}
                              item={item}
                              index={index}
                              onEdit={handleEdit}
                              onDelete={setDeleteId}
                            />
                          ))}
                        </SortableContext>
                      </tbody>
                    </table>
                    {data.length === 0 && !loading && (
                      <div className="p-4 text-center text-muted-foreground">
                        No items found.
                      </div>
                    )}
                  </div>
                </DndContext>
              ) : (
                <CustomTable
                  data={selectedType === 'financial-institutions' && countryFilter !== 'all'
                    ? data.filter(item => item.country_code === countryFilter)
                    : data}
                  columns={columns}
                  gridCols={selectedType === 'financial-institutions' ? "2fr 1fr 1.5fr 100px" : "2fr 1fr 100px"}
                  isLoading={loading}
                  emptyMessage="No items found in this list."
                />
              )}
            </>
          )}
        </div>

        <ReferenceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type={selectedType}
          item={selectedItem}
          onSuccess={() => { loadData(); }}
          defaultCountry={countryFilter !== 'all' ? countryFilter : undefined}
        />

        {isSuperAdmin && (
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
        )}
      </div>
    </div>
  );
}

// Sortable Row Component
const SortableRow = ({ item, index, onEdit, onDelete }: { item: ReferenceItem, index: number, onEdit: (i: any) => void, onDelete: (id: number) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    position: isDragging ? 'relative' : undefined,
  } as React.CSSProperties;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-muted/50",
        isDragging && "bg-muted shadow-lg opacity-80"
      )}
    >
      {/* Drag Handle */}
      <td className="p-4 align-middle w-[50px]">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab hover:text-primary active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </td>

      {/* Sl No (Priority) */}
      <td className="p-4 align-middle font-medium w-[80px]">
        {index + 1}
      </td>

      {/* Name / Value */}
      <td className="p-4 align-middle font-medium">
        {item.name}
      </td>

      {/* Status */}
      <td className="p-4 align-middle w-[100px]">
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          item.is_active
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-500"
        )}>
          {item.is_active ? "Active" : "Inactive"}
        </span>
      </td>
    </tr>
  );
};
