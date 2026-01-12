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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
} from "@/components/ui/select";
import { CustomPopup } from "@/components/ui/custom-popup";
import { Category, categoryService } from "@/services/admin/category.service";
import  api  from "@/lib/api"; // importing api to use post directly if needed, but we use service

// Category Schema
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  // image: z.string().min(1, "Image URL is required").url("Must be a valid URL"),
  image: z.string().optional(), // Make optional for now to simplify testing if no upload
  description: z.string().optional(),
  parentId: z.string().optional(), // We'll parse to number on submit
  isControlled: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null; // If null, creating. If set, updating.
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [mainCategoryId, setMainCategoryId] = useState<string>("none");
  const [subCategoryId, setSubCategoryId] = useState<string>("none");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      image: "",
      description: "",
      parentId: "none",
      isControlled: false,
    },
  });

  // Load all categories on mount
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  // Handle Edit Mode Prefill
  useEffect(() => {
    if (open && category && allCategories.length > 0) {
      // Find parent path
      const parentId = category.parentId || category.parent_id;
      
      let mainId = "none";
      let subId = "none";

      if (parentId) {
        const parent = allCategories.find(c => c.id === parentId);
        if (parent) {
            // Check if parent has a parent (Grandparent)
            const grandParentId = parent.parentId || parent.parent_id;
            if (grandParentId) {
                // Parent is a Level 2, so parentId is Level 1
                mainId = grandParentId.toString();
                subId = parentId.toString();
            } else {
                // Parent is Level 1 (Main)
                mainId = parentId.toString();
                subId = "none";
            }
        }
      }

      setMainCategoryId(mainId);
      setSubCategoryId(subId);
      setImageFile(null); // Reset file on edit load

      form.reset({
        name: category.name,
        image: category.image || "",
        description: category.description || "",
        parentId: parentId ? parentId.toString() : "none",
        // @ts-ignore
        isControlled: category.isControlled || category.is_controlled || false,
      });
    } else if (open && !category) {
        form.reset({
            name: "",
            image: "",
            description: "",
            parentId: "none",
            isControlled: false,
        });
        setMainCategoryId("none");
        setSubCategoryId("none");
        setImageFile(null);
    }
  }, [open, category, allCategories, form]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setAllCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    }
  };

  const handleMainCategoryChange = (val: string) => {
      setMainCategoryId(val);
      setSubCategoryId("none"); // Reset sub when main changes
      // Update form
      const newParentId = val === "none" ? "none" : val;
      form.setValue("parentId", newParentId);
  };

  const handleSubCategoryChange = (val: string) => {
      setSubCategoryId(val);
      // Update form
      // If sub is selected, that's the parent. If sub is none, main is parent.
      const newParentId = val !== "none" ? val : (mainCategoryId === "none" ? "none" : mainCategoryId);
      form.setValue("parentId", newParentId);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      if (data.parentId && data.parentId !== "none") {
         formData.append("parentId", data.parentId);
      } else {
         formData.append("parentId", ""); // Handle empty on backend
      }
      formData.append("isControlled", String(data.isControlled || false));

      if (imageFile) {
          formData.append("files", imageFile);
      }

      // If we have an existing image URL and no new file, we can optionally pass it
      // But usually just not sending files means keep existing. 
      // If we wanted to clear it, we might need a flag. For now, assume keeping.
      if (!imageFile && data.image) {
          formData.append("image", data.image);
      }

      if (category) {
        await categoryService.updateCategory(category.id, formData);
        toast.success("Category updated successfully");
      } else {
        await categoryService.createCategory(formData);
        toast.success("Category created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomPopup
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit Category" : "Add New Category"}
      description={category ? "Update category details" : "Create a new product category"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Category Image</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                           {/* Preview */}
                           <div className="relative w-16 h-16 border rounded bg-muted flex items-center justify-center overflow-hidden">
                                {imageFile ? (
                                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                                ) : field.value ? (
                                    <img src={field.value} alt="Current" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">No Img</span>
                                )}
                           </div>
                           <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                    </FormControl>
                </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Category Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <FormItem>
                <FormLabel>Main Category (Level 1)</FormLabel>
                <Select
                  value={mainCategoryId}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                >
                  <option value="none">None (Root Category)</option>
                  {allCategories
                    .filter((c) => !c.parentId && !c.parent_id && c.id !== category?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </FormItem>
            </div>

            <div className="flex-1">
              <FormItem>
                <FormLabel>Sub Category (Level 2)</FormLabel>
                <Select
                  value={subCategoryId}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={mainCategoryId === "none"}
                >
                  <option value="none">None (Direct Child of Main)</option>
                  {allCategories
                    .filter(
                      (c) =>
                        (c.parentId === parseInt(mainCategoryId) ||
                          c.parent_id === parseInt(mainCategoryId)) &&
                        c.id !== category?.id
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </FormItem>
            </div>
          </div>

           <input type="hidden" {...form.register("parentId")} />
          
          <FormField
            control={form.control}
            name="isControlled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Controlled Item?
                  </FormLabel>
                  <FormDescription>
                    Checking this will mark products in this category as controlled items requiring licenses.
                  </FormDescription>
                </div>
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
              {category ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </CustomPopup>
  );
}
