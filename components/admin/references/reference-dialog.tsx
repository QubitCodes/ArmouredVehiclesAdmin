"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
import { useCountries } from "@/hooks/vendor/dashboard/use-countries";
import { ChevronDown } from "lucide-react";

const referenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
  countryCode: z.string().optional(),
});

type ReferenceFormValues = z.infer<typeof referenceSchema>;

interface ReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string; // The reference type key (e.g. 'currencies')
  item: ReferenceItem | null;
  onSuccess: () => void;
  defaultCountry?: string;
}

export function ReferenceDialog({
  open,
  onOpenChange,
  type,
  item,
  onSuccess,
  defaultCountry,
}: ReferenceDialogProps) {
  const [loading, setLoading] = useState(false);
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries();

  const form = useForm<ReferenceFormValues>({
    resolver: zodResolver(referenceSchema),
    defaultValues: {
      name: "",
      isActive: true,
      displayOrder: 0,
      countryCode: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          name: item.name,
          isActive: item.is_active,
          displayOrder: item.display_order,
          countryCode: item.country_code || "",
        });
      } else {
        form.reset({
          name: "",
          isActive: true,
          displayOrder: 0,
          countryCode: defaultCountry || "",
        });
      }
    }
  }, [open, item, form, defaultCountry]);

  const onSubmit = async (data: ReferenceFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        country_code: data.countryCode // Ensure backend receives country_code
      };
      if (item) {
        await referenceService.updateItem(type, item.id, payload);
        toast.success("Item updated");
      } else {
        await referenceService.createItem(type, payload);
        toast.success("Item created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to save item");
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

          {type === 'financial-institutions' && (
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => {
                const selectedCountry = countries.find(c => c.value === field.value);
                return (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          {...field}
                          disabled={isCountriesLoading}
                          className={cn(
                            "w-full border border-input bg-transparent py-2 text-sm focus:outline-none appearance-none h-[42px] rounded-md px-3",
                            selectedCountry && "pl-10"
                          )}
                        >
                          <option value="">Select a country</option>
                          {countries.map((country) => (
                            <option key={country.value} value={country.value}>
                              {country.label}
                            </option>
                          ))}
                        </select>
                        {selectedCountry && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10">
                            {selectedCountry.flag}
                          </span>
                        )}
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

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
