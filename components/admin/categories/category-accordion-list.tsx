"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Folder, FolderOpen, ShieldCheck, ChevronRight, Package, Layers, ExternalLink, Info, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Category, categoryService } from "@/services/admin/category.service";
import { authService } from "@/services/admin/auth.service";
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

/**
 * CategoryAccordionList — Nested accordion view for admin categories.
 * Shows hierarchical categories with direct/total subcategory and product counts.
 */
export function CategoryAccordionList() {
    const [roots, setRoots] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [blockMessage, setBlockMessage] = useState<string | null>(null);
    const [isVendor, setIsVendor] = useState(false);
    const [deactivateId, setDeactivateId] = useState<number | null>(null);
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    /** All categories flat — for delete checks */
    const [allCategories, setAllCategories] = useState<Category[]>([]);

    useEffect(() => {
        const user = authService.getUserDetails();
        if (user && (user.userType === 'vendor' || user.user_type === 'vendor')) {
            setIsVendor(true);
        }
        loadData();
    }, []);

    /**
     * Fetch categories and build hierarchy tree
     */
    const loadData = async () => {
        setLoading(true);
        try {
            const all: Category[] = await categoryService.getAllCategories();
            setAllCategories(all);

            // Build hierarchy
            const categoryMap = new Map<number, Category & { children: Category[] }>();
            all.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

            const rootList: Category[] = [];

            all.forEach(cat => {
                const pId = cat.parentId ?? cat.parent_id;
                if (pId && categoryMap.has(pId)) {
                    categoryMap.get(pId)!.children!.push(categoryMap.get(cat.id)!);
                } else {
                    rootList.push(categoryMap.get(cat.id)!);
                }
            });

            setRoots(rootList);
        } catch (error) {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    /** Toggle expand/collapse */
    const toggleExpanded = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /** Expand all */
    const expandAll = () => {
        const allIds = new Set(allCategories.map(c => c.id));
        setExpandedIds(allIds);
    };

    /** Collapse all */
    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    /**
     * Filter the category tree based on search query.
     * If a child matches, its entire parent chain is preserved.
     * If a parent matches, all its children are included.
     */
    const filteredRoots = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return roots;

        /** Recursively filter a tree node */
        const filterNode = (node: Category): Category | null => {
            const nameMatch = node.name.toLowerCase().includes(query);
            const children = (node.children || []) as Category[];

            if (nameMatch) {
                // Parent matches — include it with ALL children
                return node;
            }

            // Check if any descendant matches
            const filteredChildren = children
                .map(child => filterNode(child))
                .filter(Boolean) as Category[];

            if (filteredChildren.length > 0) {
                // A descendant matched — keep this node with only the matching branch
                return { ...node, children: filteredChildren };
            }

            return null;
        };

        return roots.map(r => filterNode(r)).filter(Boolean) as Category[];
    }, [roots, searchQuery]);

    /**
     * When searching, auto-expand all categories so matches are visible.
     * Collect all IDs from the filtered tree.
     */
    const searchExpandedIds = useMemo(() => {
        if (!searchQuery.trim()) return null; // null = use manual expandedIds

        const ids = new Set<number>();
        const collect = (nodes: Category[]) => {
            for (const node of nodes) {
                ids.add(node.id);
                if (node.children) collect(node.children as Category[]);
            }
        };
        collect(filteredRoots);
        return ids;
    }, [filteredRoots, searchQuery]);

    /** Effective expanded IDs — uses search-based expansion when searching */
    const effectiveExpandedIds = searchExpandedIds ?? expandedIds;

    // --- Actions (same as original) ---
    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        const category = allCategories.find(c => c.id === id);
        if (!category) return;

        const productCount = category.product_count ?? 0;
        if (productCount > 0) {
            setBlockMessage(
                `Cannot delete "${category.name}". It has ${productCount} product${productCount !== 1 ? 's' : ''} assigned to it. Please reassign or remove the products first.`
            );
            return;
        }

        const hasChildren = allCategories.some(c => (c.parentId ?? c.parent_id) === id);
        if (hasChildren) {
            setBlockMessage(
                `Cannot delete "${category.name}". It has subcategories. Please delete the subcategories first.`
            );
            return;
        }

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

    const handleToggleActive = async (item: Category) => {
        const isCurrentlyActive = item.is_active !== false;
        if (isCurrentlyActive) {
            setDeactivateId(item.id);
        } else {
            await performToggle(item.id, true);
        }
    };

    const performToggle = async (id: number, isActive: boolean) => {
        setTogglingIds(prev => new Set(prev).add(id));
        try {
            const response = await categoryService.toggleCategoryActive(id, isActive);
            toast.success(response.message || 'Category status updated');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const confirmDeactivate = async () => {
        if (!deactivateId) return;
        await performToggle(deactivateId, false);
        setDeactivateId(null);
    };

    // --- Count Badge Component ---
    const CountBadge = ({ published, total, label }: { published: number; total: number; label: string }) => (
        <div className="flex items-center gap-1 text-xs" title={label}>
            <span className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title={`${label} (Published)`}>
                {published}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground" title={`${label} (Total)`}>
                {total}
            </span>
        </div>
    );

    // --- Stat Pill Component ---
    const StatPill = ({ icon: Icon, label, value, className }: { icon: any; label: string; value: React.ReactNode; className?: string }) => (
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-card text-xs", className)} title={label}>
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">{label}:</span>
            {value}
        </div>
    );

    /**
     * Highlight matching text within a category name.
     * Splits the text at query boundaries and wraps matches in a highlight span.
     */
    const highlightMatch = (text: string) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return text;

        const idx = text.toLowerCase().indexOf(query);
        if (idx === -1) return text;

        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + query.length);
        const after = text.slice(idx + query.length);

        return (
            <>
                {before}
                <span className="bg-yellow-200 dark:bg-amber-700/50 rounded-sm px-0.5">{match}</span>
                {after}
            </>
        );
    };

    // --- Recursive Accordion Row ---
    const CategoryRow = ({ category, depth, ancestorIds = [] }: { category: Category; depth: number; ancestorIds?: number[] }) => {
        const children = category.children || [];
        const hasChildren = children.length > 0;
        const isExpanded = effectiveExpandedIds.has(category.id);
        const isInactive = category.is_active === false;
        const isControlled = category.isControlled || category.is_controlled;

        return (
            <div className={cn(
                "border-b",
                isInactive && "opacity-60"
            )}>
                {/* Category Header Row */}
                <div
                    className={cn(
                        "flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors group min-h-[72px]",
                        depth === 0 && "bg-muted/30 dark:bg-muted/10",
                        depth === 1 && "bg-amber-50/40 dark:bg-amber-950/15",
                        depth >= 2 && "bg-stone-100/60 dark:bg-stone-900/20",
                    )}
                    style={{ paddingLeft: '16px' }}
                >
                    {/* Expand/Collapse Toggle — only rendered for parents */}
                    {hasChildren && (
                        <button
                            onClick={() => toggleExpanded(category.id)}
                            className="flex items-center justify-center w-6 h-6 rounded-md transition-all shrink-0 self-start mt-1 hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                            <ChevronRight className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded && "rotate-90"
                            )} />
                        </button>
                    )}

                    {/* Folder Icon + Name (allow 2-line wrap) */}
                    <div className="flex items-start gap-2 min-w-[200px] flex-1 self-start">
                        <div className="mt-0.5 shrink-0">
                            {isExpanded ? (
                                <FolderOpen className={cn("h-4 w-4", depth === 0 ? "text-primary" : "text-primary/60")} />
                            ) : (
                                <Folder className={cn("h-4 w-4", depth === 0 ? "text-primary" : "text-primary/60")} />
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className={cn(
                                "font-medium leading-tight line-clamp-2",
                                depth === 0 && "text-sm font-semibold",
                                depth === 1 && "text-sm",
                                depth >= 2 && "text-sm text-muted-foreground"
                            )}>
                                {highlightMatch(category.name)}
                            </span>
                            {isControlled && (
                                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                                    Controlled
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats — 2-row fixed grid (admin only) */}
                    {!isVendor && (
                        <div className={cn("grid grid-cols-2 gap-x-3 gap-y-1.5 shrink-0 w-[380px]", !hasChildren && "justify-items-end")}>
                            {/* Row 1: Products */}
                            {hasChildren && (
                                <StatPill
                                    icon={Package}
                                    label="Direct Products"
                                    value={<CountBadge published={category.published_product_count ?? 0} total={category.product_count ?? 0} label="Direct Products" />}
                                />
                            )}
                            {hasChildren ? (
                                <StatPill
                                    icon={Package}
                                    label="Total Products"
                                    className="border-dashed"
                                    value={<CountBadge published={category.total_published_product_count ?? 0} total={category.total_product_count ?? 0} label="Total Products" />}
                                />
                            ) : (
                                <StatPill
                                    icon={Package}
                                    label="Direct Products"
                                    className="col-start-2"
                                    value={<CountBadge published={category.published_product_count ?? 0} total={category.product_count ?? 0} label="Direct Products" />}
                                />
                            )}

                            {/* Row 2: Subcategories — only show for categories that have children */}
                            {hasChildren && (
                                <>
                                    <StatPill
                                        icon={Layers}
                                        label="Direct Subcats"
                                        value={<span className="font-medium">{category.direct_subcategory_count ?? 0}</span>}
                                    />
                                    {(category.total_subcategory_count ?? 0) > (category.direct_subcategory_count ?? 0) ? (
                                        <StatPill
                                            icon={Layers}
                                            label="Total Subcats"
                                            className="border-dashed"
                                            value={<span className="font-medium">{category.total_subcategory_count ?? 0}</span>}
                                        />
                                    ) : (
                                        <div />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Active Toggle + Actions */}
                    {!isVendor && (
                        <div className="flex items-center gap-1 shrink-0 self-start mt-1" onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={category.is_active !== false}
                                disabled={togglingIds.has(category.id)}
                                onCheckedChange={() => handleToggleActive(category)}
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="View products in this category">
                                <Link href={(() => {
                                    const params = new URLSearchParams();
                                    params.set('scope', 'all');
                                    if (depth === 0) {
                                        params.set('main-cat', String(category.id));
                                    } else if (depth === 1) {
                                        params.set('main-cat', String(ancestorIds[0]));
                                        params.set('cat', String(category.id));
                                    } else if (depth >= 2) {
                                        params.set('main-cat', String(ancestorIds[0]));
                                        params.set('cat', String(ancestorIds[1]));
                                        params.set('sub-cat', String(category.id));
                                    }
                                    return `/admin/products?${params.toString()}`;
                                })()} target="_blank">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(category.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Children (Accordion Body) */}
                {hasChildren && isExpanded && (
                    <div className="ml-8 mt-1 mb-6 mr-4">
                        <div className={cn(
                            "border rounded-lg overflow-hidden",
                            depth === 0 && "border-primary/20",
                            depth === 1 && "border-primary/10",
                            depth >= 2 && "border-muted-foreground/10",
                        )}>
                            {children.map(child => (
                                <CategoryRow key={child.id} category={child} depth={depth + 1} ancestorIds={[...ancestorIds, category.id]} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- Loading Skeleton ---
    if (loading) {
        return (
            <>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                        <p className="text-muted-foreground">Manage product categories and hierarchy.</p>
                    </div>
                </div>
                <div className="border rounded-lg overflow-hidden bg-card">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-4 border-b last:border-b-0 animate-pulse">
                            <div className="w-6 h-6 rounded bg-muted" />
                            <div className="w-4 h-4 rounded bg-muted" />
                            <div className="h-4 rounded bg-muted" style={{ width: `${150 + Math.random() * 100}px` }} />
                            <div className="flex-1" />
                            <div className="h-6 w-20 rounded bg-muted" />
                            <div className="h-6 w-20 rounded bg-muted" />
                        </div>
                    ))}
                </div>
            </>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">Manage product categories and hierarchy.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={expandAll}>
                        Expand All
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAll}>
                        Collapse All
                    </Button>
                    {!isVendor && (
                        <Button onClick={() => { setSelectedCategory(null); setDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    )}
                </div>
            </div>

            {/* Legend + Search Row */}
            <div className="flex items-start justify-between gap-4 mb-3">
                {/* Left: Legend & Info Note (admin only) */}
                {!isVendor && (
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-1 text-xs text-muted-foreground px-1">
                            <div className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
                                <span>Published</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-muted border" />
                                <span>Total</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>Products</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                <span>Subcategories</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-[10px]">
                                <span className="border px-1 rounded">solid border</span>
                                <span>= Direct</span>
                                <span className="border border-dashed px-1 rounded ml-1">dashed</span>
                                <span>= Total (incl. nested)</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 text-[11px] text-blue-700 dark:text-blue-400">
                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <p>
                                <span className="font-semibold">Published</span> = Products visible to customers (<span className="font-medium">Published</span> &amp; <span className="font-medium">Out of Stock</span>).
                                <span className="mx-1">·</span>
                                <span className="font-semibold">Total</span> = All products including <span className="font-medium">Draft</span> and <span className="font-medium">Inactive</span>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Right: Search (full width for vendors) */}
                <div className={cn("relative shrink-0", isVendor ? "w-full" : "w-72")}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Accordion Tree */}
            {filteredRoots.length === 0 ? (
                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Folder className="h-10 w-10 mb-2 opacity-30" />
                        <p>{searchQuery ? 'No categories match your search.' : 'No categories found.'}</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredRoots.map(root => (
                        <div key={root.id} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                            <CategoryRow category={root} depth={0} ancestorIds={[]} />
                        </div>
                    ))}
                </div>
            )}

            {/* Category Dialog (Edit/Create) */}
            <CategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={selectedCategory}
                onSuccess={loadData}
            />

            {/* Delete Confirmation Dialog */}
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

            {/* Cannot Delete Dialog */}
            <AlertDialog open={!!blockMessage} onOpenChange={(open) => !open && setBlockMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cannot Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>{blockMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>OK</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Deactivate Confirmation Dialog */}
            <AlertDialog open={!!deactivateId} onOpenChange={(open) => !open && setDeactivateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deactivating this category will hide it and all subcategories and products under it from the public storefront. Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive" onClick={confirmDeactivate}>Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
