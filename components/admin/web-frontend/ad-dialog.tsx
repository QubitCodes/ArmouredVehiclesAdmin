
"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { FrontendAd, webFrontendService } from "@/services/admin/web-frontend.service";
import { uploadService } from "@/services/admin/upload.service";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";

interface AdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: FrontendAd | null;
    onSuccess: () => void;
}

export function AdDialog({ open, onOpenChange, item, onSuccess }: AdDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        location: "footer",
        title: "",
        link: "",
        is_active: true,
        valid_till: ""
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (item) {
            setFormData({
                location: item.location || "footer",
                title: item.title || "",
                link: item.link || "",
                is_active: item.is_active,
                valid_till: item.valid_till ? new Date(item.valid_till).toISOString().split('T')[0] : ""
            });
            setPreviewUrl(item.image_url || null);
            setImageFile(null);
        } else {
            setFormData({
                location: "footer",
                title: "",
                link: "",
                is_active: true,
                valid_till: ""
            });
            setPreviewUrl(null);
            setImageFile(null);
        }
    }, [item, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = item?.image_url;

            if (imageFile) {
                const uploadRes = await uploadService.uploadFile(imageFile, 'FRONTEND_AD');
                if (uploadRes.success && uploadRes.data?.url) {
                    imageUrl = uploadRes.data.path || uploadRes.data.url;
                } else {
                    throw new Error("Image upload failed");
                }
            }

            if (!imageUrl && !formData.title) {
                throw new Error("Image or Title is required");
            }
            // For Ads, image might be optional if title link? But usually required. 
            // Existing logic said "Image or Title is required".
            // If image is uploaded or existing, we use it.

            const payload = {
                location: formData.location,
                title: formData.title,
                link: formData.link,
                is_active: formData.is_active,
                valid_till: formData.valid_till ? new Date(formData.valid_till).toISOString() : null,
                image_url: imageUrl
            };

            if (item) {
                await webFrontendService.updateAd(item.id, payload);
                toast.success("Ad updated");
            } else {
                await webFrontendService.createAd(payload);
                toast.success("Ad created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save ad");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Ad" : "Add New Ad"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Select
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        >
                            <option value="footer">Footer</option>
                            <option value="products_sidebar">Products Page (Sidebar)</option>
                        </Select>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Ad Image</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-40 relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain rounded-md"
                                />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Upload className="mx-auto h-8 w-8 mb-2" />
                                    <span>Click to upload image</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Title / Alt Text</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ad description"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Link URL</Label>
                        <Input
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="Target URL"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valid Till</Label>
                            <Input
                                type="date"
                                value={formData.valid_till}
                                onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="is_active_ad"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                            />
                            <Label htmlFor="is_active_ad">Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
