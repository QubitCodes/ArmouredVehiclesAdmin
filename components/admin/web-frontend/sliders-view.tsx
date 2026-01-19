
"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { FrontendSlider, webFrontendService } from "@/services/admin/web-frontend.service";
import { SliderDialog } from "./slider-dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
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

export function SlidersView() {
    const [data, setData] = useState<FrontendSlider[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FrontendSlider | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const items = await webFrontendService.getSliders();
            setData(items);
        } catch (error) {
            toast.error("Failed to load sliders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (item: FrontendSlider) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await webFrontendService.deleteSlider(deleteId);
            toast.success("Slider deleted");
            loadData();
        } catch (error: any) {
            toast.error("Failed to delete slider");
        } finally {
            setDeleteId(null);
        }
    };

    const columns: Column<FrontendSlider>[] = [
        {
            header: "Image",
            render: (item) => (
                <div className="relative h-12 w-20 rounded overflow-hidden border">
                    <Image src={item.image_url} alt={item.title || "Slide"} fill className="object-cover" />
                </div>
            )
        },
        {
            header: "Details",
            render: (item) => (
                <div className="flex flex-col">
                    <span className="font-medium">{item.title || "No Title"}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    {item.link && (
                        <a href={item.link} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            {item.link} <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
            )
        },
        {
            header: "Order",
            accessorKey: "sort_order",
        },
        {
            header: "Status",
            render: (item) => (
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                        item.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                    )}>
                        {item.is_active ? "Active" : "Inactive"}
                    </span>
                    {item.valid_till && (
                        <span className="text-[10px] text-muted-foreground">
                            Exp: {new Date(item.valid_till).toLocaleDateString()}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Actions",
            render: (item) => (
                <div className="flex items-center gap-2">
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
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Home Slider</h2>
                    <p className="text-muted-foreground text-sm">Manage main homepage carousel slides.</p>
                </div>
                <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Slide
                </Button>
            </div>

            <CustomTable
                data={data}
                columns={columns}
                gridCols="80px 2fr 0.5fr 1fr 100px" // Adjusted for Image, Details, Order, Status, Actions
                isLoading={loading}
                emptyMessage="No slides found."
            />

            <SliderDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={selectedItem}
                onSuccess={loadData}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
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
