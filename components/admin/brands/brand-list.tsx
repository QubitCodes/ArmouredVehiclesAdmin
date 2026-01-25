"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { Brand, brandService } from "@/services/admin/brand.service";
import { BrandDialog } from "./brand-dialog";
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

export function BrandList() {
    const [data, setData] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Brand | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const items = await brandService.getAll({ search });
            setData(items);
        } catch (error) {
            toast.error("Failed to load brands");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search]);

    const handleEdit = (item: Brand) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await brandService.delete(deleteId);
            toast.success("Brand deleted");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete");
        } finally {
            setDeleteId(null);
        }
    };

    const columns: Column<Brand>[] = [
        {
            header: "Name",
            accessorKey: "name",
            className: "font-medium"
        },
        {
            header: "Icon",
            accessorKey: "icon",
            render: (item) => item.icon ? (
                <img src={item.icon} alt={item.name} className="h-8 w-8 object-contain" />
            ) : null
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Brands</h2>
                    <p className="text-muted-foreground text-sm">Manage vehicle brands.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Brand
                </Button>
            </div>

            <CustomTable
                data={data}
                columns={columns}
                isLoading={loading}
                emptyMessage="No brands found."
            />

            <BrandDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={selectedItem}
                onSuccess={loadData}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Action cannot be undone. Ensure no products are using this brand before deleting.
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
