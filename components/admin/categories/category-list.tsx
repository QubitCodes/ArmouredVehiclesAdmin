"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Folder, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { Category, categoryService } from "@/services/admin/category.service";
import { authService } from "@/services/admin/auth.service"; // Import authService
import { CategoryDialog } from "./category-dialog";
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
import { cn } from "@/lib/utils";

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    // Check role on mount
    const user = authService.getUserDetails();
    if (user && user.userType === 'vendor') { // Check userType or user_type? usually userType in stored obj
      setIsVendor(true);
    } else if (user && user.user_type === 'vendor') {
      setIsVendor(true);
    }

    // Also if no user, check maybe authService normalized logic?
    // Let's rely on standard object property check.
    loadData();
  }, []);

  // Improved fetch strategy utilizing existing endpoints
  const loadData = async () => {
    setLoading(true);
    try {
      const all: Category[] = await categoryService.getAllCategories();

      // Build hierarchy map
      const categoryMap = new Map<number, Category & { children?: Category[] }>();
      all.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

      const roots: (Category & { children?: Category[] })[] = [];

      // Assign children to parents
      all.forEach(cat => {
        // Normalize parentId
        const pId = cat.parentId ?? cat.parent_id;

        if (pId && categoryMap.has(pId)) {
          const parent = categoryMap.get(pId);
          if (parent) parent.children?.push(categoryMap.get(cat.id)!);
        } else {
          roots.push(categoryMap.get(cat.id)!);
        }
      });

      // Flatten for table display
      const flattened: (Category & { level: number })[] = [];
      const traverse = (nodes: (Category & { children?: Category[] })[], level: number) => {
        nodes.forEach(node => {
          flattened.push({ ...node, level });
          if (node.children && node.children.length > 0) {
            traverse(node.children, level + 1);
          }
        });
      };

      traverse(roots, 0);
      setCategories(flattened);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await categoryService.deleteCategory(deleteId);
      toast.success("Category deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const columns: Column<Category & { level?: number }>[] = [
    {
      header: "Name",
      accessorKey: "name",
      render: (item) => (
        <div className="flex items-center gap-2 font-medium text-black" style={{ paddingLeft: `${(item.level || 0) * 24}px` }}>
          {(item.level || 0) > 0 ? <div className="border-l-2 border-b-2 w-3 h-3 border-gray-300 -mt-2 mr-1"></div> : null}
          <Folder className="h-4 w-4 text-primary/50" />
          {item.name}
        </div>
      )
    },
    {
      header: "Description",
      accessorKey: "description",
      className: "text-muted-foreground text-sm truncate max-w-[300px]"
    },
    {
      header: "Controlled",
      accessorKey: "isControlled",
      render: (item) => (
        (item.isControlled || item.is_controlled) ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Controlled
          </span>
        ) : null
      )
    },
    {
      header: "Products",
      accessorKey: "product_count",
      render: (item) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {item.product_count ?? 0}
        </span>
      )
    }
  ];

  // Only add Actions column if NOT vendor
  if (!isVendor) {
    columns.push({
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    });
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage product categories and hierarchy.</p>
        </div>
        {!isVendor && (
          <Button onClick={() => { setSelectedCategory(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        )}
      </div>

      <CustomTable
        data={categories}
        columns={columns}
        gridCols={!isVendor ? "2fr 3fr 1fr 80px 100px" : "2fr 3fr 1fr 80px"} // Name, Description, Controlled, Products, Actions
        isLoading={loading}
        onRowClick={(item) => {
          // Optional: navigate to subcategories?
          // router.push(`/admin/categories/${item.id}`)
        }}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
              Ensure it has no subcategories or products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
