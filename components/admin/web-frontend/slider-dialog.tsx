
"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FrontendSlider, webFrontendService } from "@/services/admin/web-frontend.service";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";

interface SliderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: FrontendSlider | null;
    onSuccess: () => void;
}

export function SliderDialog({ open, onOpenChange, item, onSuccess }: SliderDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        link: "",
        button_text: "",
        sort_order: 0,
        is_active: true,
        valid_till: ""
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || "",
                subtitle: item.subtitle || "",
                link: item.link || "",
                button_text: item.button_text || "",
                sort_order: item.sort_order || 0,
                is_active: item.is_active,
                valid_till: item.valid_till ? new Date(item.valid_till).toISOString().split('T')[0] : ""
            });
            setPreviewUrl(item.image_url);
            setImageFile(null);
        } else {
            setFormData({
                title: "",
                subtitle: "",
                link: "",
                button_text: "",
                sort_order: 0,
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
            const data = new FormData();
            if (imageFile) data.append("files", imageFile);
            data.append("title", formData.title);
            data.append("subtitle", formData.subtitle);
            data.append("link", formData.link);
            data.append("button_text", formData.button_text);
            data.append("sort_order", formData.sort_order.toString());
            data.append("is_active", formData.is_active.toString());
            if (formData.valid_till) {
                // Adjust for ISO string requirement possibly
                data.append("valid_till", new Date(formData.valid_till).toISOString());
            }

            if (item) {
                await webFrontendService.updateSlider(item.id, data);
                toast.success("Slider updated");
            } else {
                if (!imageFile) throw new Error("Image is required");
                await webFrontendService.createSlider(data);
                toast.success("Slider created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save slider");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Slider" : "Add New Slider"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Slide Image (Required)</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors h-40 relative"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover rounded-md"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Display Title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="Short description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
                                value={formData.button_text}
                                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                placeholder="e.g. Shop Now"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL</Label>
                            <Input
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="/products/..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valid Till (Optional)</Label>
                            <Input
                                type="date"
                                value={formData.valid_till}
                                onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                            />
                            <Label htmlFor="is_active">Active</Label>
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
