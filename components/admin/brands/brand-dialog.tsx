"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CustomPopup } from "@/components/ui/custom-popup";
import { Brand, brandService } from "@/services/admin/brand.service";

const brandSchema = z.object({
    name: z.string().min(1, "Name is required"),
    icon: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Brand | null;
    onSuccess: () => void;
}

export function BrandDialog({
    open,
    onOpenChange,
    item,
    onSuccess,
}: BrandDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<BrandFormValues>({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            name: "",
            icon: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (item) {
                form.reset({
                    name: item.name,
                    icon: item.icon || "",
                });
            } else {
                form.reset({
                    name: "",
                    icon: "",
                });
            }
        }
    }, [open, item, form]);

    const onSubmit = async (data: BrandFormValues) => {
        setLoading(true);
        try {
            if (item) {
                await brandService.update(item.id, data);
                toast.success("Brand updated");
            } else {
                await brandService.create(data);
                toast.success("Brand created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save brand");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomPopup
            open={open}
            onOpenChange={onOpenChange}
            title={item ? "Edit Brand" : "Add Brand"}
            description="Manage product brands."
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Toyota" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Icon URL (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </Form>
        </CustomPopup>
    );
}
