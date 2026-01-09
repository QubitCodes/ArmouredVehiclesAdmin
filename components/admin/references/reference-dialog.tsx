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
import { Checkbox } from "@/components/ui/checkbox";
import { CustomPopup } from "@/components/ui/custom-popup";
import { ReferenceItem, referenceService } from "@/services/admin/reference.service";

const referenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().optional(),
});

type ReferenceFormValues = z.infer<typeof referenceSchema>;

interface ReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string; // The reference type key (e.g. 'currencies')
  item: ReferenceItem | null;
  onSuccess: () => void;
}

export function ReferenceDialog({
  open,
  onOpenChange,
  type,
  item,
  onSuccess,
}: ReferenceDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ReferenceFormValues>({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      name: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          isActive: item.is_active,
          displayOrder: item.display_order,
        });
      } else {
        form.reset({
          name: "",
          isActive: true,
          displayOrder: 0, // Backend auto-increments if 0/undefined usually, but let's see.
        });
      }
    }
  }, [open, item, form]);

  const onSubmit = async (data: ReferenceFormValues) => {
    setLoading(true);
    try {
      if (item) {
        await referenceService.updateItem(type, item.id, data);
        toast.success("Item updated");
      } else {
        await referenceService.createItem(type, data);
        toast.success("Item created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const humanType = type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <CustomPopup
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Edit ${humanType}` : `Add ${humanType}`}
      description={`Manage ${humanType} value.`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value / Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. USD, Retail, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  Active (Visible in dropdowns)
                </FormLabel>
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
