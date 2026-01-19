
"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { FrontendAd, webFrontendService } from "@/services/admin/web-frontend.service";
import { AdDialog } from "./ad-dialog";
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

export function AdsView() {
    const [data, setData] = useState<FrontendAd[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FrontendAd | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [filterLocation, setFilterLocation] = useState<string | undefined>(undefined);

    const loadData = async () => {
        setLoading(true);
        try {
            const items = await webFrontendService.getAds(filterLocation);
            setData(items);
        } catch (error) {
            toast.error("Failed to load ads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterLocation]);

    const handleEdit = (item: FrontendAd) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await webFrontendService.deleteAd(deleteId);
            toast.success("Ad deleted");
            loadData();
        } catch (error: any) {
            toast.error("Failed to delete ad");
        } finally {
            setDeleteId(null);
        }
    };

    const columns: Column<FrontendAd>[] = [
        {
            header: "Preview",
            render: (item) => (
                item.image_url ? (
                    <div className="relative h-12 w-20 rounded overflow-hidden border">
                        <Image src={item.image_url} alt={item.title || "Ad"} fill className="object-contain" />
                    </div>
                ) : <span className="text-xs text-muted-foreground">No Image</span>
            )
        },
        {
            header: "Details",
            render: (item) => (
                <div className="flex flex-col">
                    <span className="font-medium">{item.title || "Untitled Ad"}</span>
                    <span className="text-xs text-muted-foreground uppercase">{item.location.replace('_', ' ')}</span>
                    {item.link && (
                        <a href={item.link} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            {item.link} <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
            )
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
                    <h2 className="text-2xl font-bold tracking-tight">Website Ads</h2>
                    <p className="text-muted-foreground text-sm">Manage banners and advertisements.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                        onChange={(e) => setFilterLocation(e.target.value || undefined)}
                        value={filterLocation || ""}
                    >
                        <option value="">All Locations</option>
                        <option value="footer">Footer</option>
                        <option value="products_sidebar">Products Page</option>
                    </select>
                    <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Ad
                    </Button>
                </div>
            </div>

            <CustomTable
                data={data}
                columns={columns}
                gridCols="80px 2fr 1fr 100px"
                isLoading={loading}
                emptyMessage="No ads found."
            />

            <AdDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={selectedItem}
                onSuccess={loadData}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
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
