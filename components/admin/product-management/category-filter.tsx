'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select } from '@/components/ui/select';
import { categoryService, Category } from '@/services/admin/category.service';
import { Loader2 } from 'lucide-react';

/**
 * CategoryFilter — 3-level cascading category filter for the products page.
 * Syncs selections with URL params: main-cat, cat, sub-cat.
 * Each level loads options from the API on demand.
 */
export function CategoryFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /** Current URL-driven values */
    const mainCatParam = searchParams.get('main-cat') || '';
    const catParam = searchParams.get('cat') || '';
    const subCatParam = searchParams.get('sub-cat') || '';

    /** Category options for each level */
    const [mainCategories, setMainCategories] = useState<Category[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Category[]>([]);

    /** Loading states */
    const [loadingMain, setLoadingMain] = useState(true);
    const [loadingCat, setLoadingCat] = useState(false);
    const [loadingSub, setLoadingSub] = useState(false);

    /**
     * Helper — update URL search params while preserving existing ones.
     * Resets page to 1 whenever filters change.
     */
    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            // Reset to page 1 on filter change
            params.delete('page');

            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            router.replace(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    /** Load main categories on mount */
    useEffect(() => {
        let cancelled = false;
        setLoadingMain(true);
        categoryService
            .getMainCategories()
            .then((data: Category[]) => {
                if (!cancelled) setMainCategories(data || []);
            })
            .catch(() => {
                if (!cancelled) setMainCategories([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingMain(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    /** Load categories when main category changes */
    useEffect(() => {
        if (!mainCatParam) {
            setCategories([]);
            setSubCategories([]);
            return;
        }
        let cancelled = false;
        setLoadingCat(true);
        categoryService
            .getCategoriesByParent(Number(mainCatParam))
            .then((data: Category[]) => {
                if (!cancelled) setCategories(data || []);
            })
            .catch(() => {
                if (!cancelled) setCategories([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingCat(false);
            });
        return () => {
            cancelled = true;
        };
    }, [mainCatParam]);

    /** Load sub-categories when category changes */
    useEffect(() => {
        if (!catParam) {
            setSubCategories([]);
            return;
        }
        let cancelled = false;
        setLoadingSub(true);
        categoryService
            .getCategoriesByParent(Number(catParam))
            .then((data: Category[]) => {
                if (!cancelled) setSubCategories(data || []);
            })
            .catch(() => {
                if (!cancelled) setSubCategories([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingSub(false);
            });
        return () => {
            cancelled = true;
        };
    }, [catParam]);

    /** Handlers */
    const handleMainCatChange = (value: string) => {
        // Clear child selections when parent changes
        updateParams({ 'main-cat': value, 'cat': '', 'sub-cat': '' });
    };

    const handleCatChange = (value: string) => {
        // Clear sub-cat when category changes
        updateParams({ 'cat': value, 'sub-cat': '' });
    };

    const handleSubCatChange = (value: string) => {
        updateParams({ 'sub-cat': value });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* Main Category */}
            <div className="relative min-w-[180px]">
                <Select
                    value={mainCatParam}
                    onChange={(e) => handleMainCatChange(e.target.value)}
                    className="rounded-md"
                    disabled={loadingMain}
                >
                    <option value="">All Main Categories</option>
                    {mainCategories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
                {loadingMain && (
                    <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Category */}
            <div className="relative min-w-[180px]">
                <Select
                    value={catParam}
                    onChange={(e) => handleCatChange(e.target.value)}
                    className="rounded-md"
                    disabled={!mainCatParam || loadingCat}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
                {loadingCat && (
                    <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Sub Category */}
            <div className="relative min-w-[180px]">
                <Select
                    value={subCatParam}
                    onChange={(e) => handleSubCatChange(e.target.value)}
                    className="rounded-md"
                    disabled={!catParam || loadingSub}
                >
                    <option value="">All Sub Categories</option>
                    {subCategories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
                {loadingSub && (
                    <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
            </div>
        </div>
    );
}
