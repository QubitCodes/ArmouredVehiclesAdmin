"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Folder, FolderOpen, File } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTable, Column } from "@/components/ui/custom-table";
import { Category, categoryService } from "@/services/admin/category.service";
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

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // For now, fetching main categories and subcategories separately isn't efficient for a full list.
      // But we have `getMainCategories` and `getCategoriesByParent`.
      // Let's assume we want to show Main Categories first, and maybe expandable rows?
      // CustomTable doesn't support expandable rows yet.
      // Let's just list Main Categories and offer a "View Subcategories" button?
      // Or just list ALL categories if we add a getAll endpoint?
      // The current backend `list` (GET /categories) returns ALL.
      // Let's use that. But `categoryService` didn't have `getAll`. I'll add `api.get('/categories')` here directly or update service.
      // Let's stick strictly to `categoryService`. It has `getMainCategories`.
      // I'll show Main Categories. If you click one, you drill down?
      // "Categories have a parent_id and can only go upto a max 3 levels."
      // Let's try to display a flat list with Hierarchy indication (Parent > Child) for simplicity and robustness.
      // Actually, let's just use `api.get('/categories')` to get everything and build the tree.
      
      const allResponse = await categoryService.getMainCategories(); // This is just main.
      // Wait, let's verify if I can get all. 
      // Backend `CategoryController.list` is mounted at `GET /api/v1/categories`.
      // Service `createCategory` calls `POST /categories`.
      // I can add `getAll` to service or just use `api` here.
      // Cleanest is to use `getMainCategories`? No, that misses subs.
      // Let's assume I strictly follow the "Standard" table. 
      // I'll add a `getAll` method to `CategoryList` via direct API or Service update.
      // I'll assume for now I can just fetch `/categories` (list all).
      
      const response = await fetch('/api/v1/categories', { headers: { 'Authorization': `Bearer ${document.cookie}`}}); 
      // No, let's use the verifyAuth token properly. `api` lib handles it.
      // I will implement a quick helper here.
    } catch (error) {
       console.error(error);
    }
  };

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
          if (cat.parentId && categoryMap.has(cat.parentId)) { // Use parentId from valid type if available or parent_id
              const parent = categoryMap.get(cat.parentId || (cat as any).parent_id);
              if (parent) parent.children?.push(categoryMap.get(cat.id)!);
          } else if ((cat as any).parent_id && categoryMap.has((cat as any).parent_id)) { 
               // Fallback for parent_id if interface uses parentId but API returns parent_id
               const parent = categoryMap.get((cat as any).parent_id);
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
      
      // Sort roots by name?
      // roots.sort((a, b) => a.name.localeCompare(b.name));
      // Children sorting should ideally happen too.
      // But API might return sorted.
      
      traverse(roots, 0);
      setCategories(flattened);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const columns: Column<Category & { level?: number } >[] = [
    {
      header: "Name",
      accessorKey: "name",
      render: (item) => (
        <div className="flex items-center gap-2 font-medium" style={{ paddingLeft: `${(item.level || 0) * 24}px` }}>
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
    }
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage product categories and hierarchy.</p>
        </div>
        <Button onClick={() => { setSelectedCategory(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <CustomTable 
        data={categories} 
        columns={columns} 
        gridCols="2fr 3fr 100px"
        isLoading={loading}
        onRowClick={(item) => {
            // Optional: navigate to subcategories?
            // router.push(/admin/categories/${item.id})
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
