"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateProduct } from "@/hooks/admin/product-management/use-products";

const addProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  category: z.string().optional(),
  stock: z.number().min(0, "Stock must be greater than or equal to 0").optional(),
  sku: z.string().optional(),
  imageUrl: z
    .union([z.string().url("Please enter a valid URL"), z.literal("")])
    .optional(),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      stock: 0,
      sku: "",
      imageUrl: "",
    },
  });

  const createProductMutation = useCreateProduct();

  const onSubmit = async (data: AddProductFormValues) => {
    try {
      await createProductMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        basePrice: data.price,
        category: data.category || undefined,
        stock: data.stock || undefined,
        sku: data.sku || undefined,
        imageUrl: data.imageUrl || undefined,
      });

      toast.success("Product created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      
      let errorMessage = "Failed to create product. Please try again.";
      
      if (axiosError?.response?.status === 403) {
        errorMessage = "You don't have permission to create products.";
      } else if (axiosError?.response?.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else {
        errorMessage =
          axiosError?.response?.data?.error ||
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-wide">
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Enter the details to create a new product
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Product Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product name"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product description"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Price
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Category
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter category"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Stock
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter stock quantity"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    SKU
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter SKU"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Image URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="Enter image URL"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={createProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={createProductMutation.isPending}
                className="font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

