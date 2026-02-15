'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { referenceService } from '@/services/admin/reference.service';

/**
 * Shape of a single VAT rule from the platform_settings JSON
 */
interface VatRule {
    id: number;
    scenario: string;
    source_region: string;
    destination_region: string;
    vendor_to_admin_vat_percent: number;
    admin_to_customer_vat_percent: number;
}

/**
 * VatRulesPanel — Displays the 4 VAT scenarios in a table
 * with editable percentage fields for vendor→admin and admin→customer VAT.
 */
export function VatRulesPanel() {
    const [rules, setRules] = useState<VatRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    /**
     * Fetch the vat_rules setting from the API
     */
    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            const data = await referenceService.getPlatformSetting('vat_rules');
            if (Array.isArray(data.value)) {
                setRules(data.value);
            }
        } catch (error) {
            console.error('Failed to load VAT rules:', error);
            toast.error('Failed to load VAT rules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    /**
     * Handle percentage change for a specific rule field
     */
    const handleChange = (ruleId: number, field: 'vendor_to_admin_vat_percent' | 'admin_to_customer_vat_percent', value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

        setRules(prev =>
            prev.map(rule =>
                rule.id === ruleId ? { ...rule, [field]: numValue } : rule
            )
        );
        setDirty(true);
    };

    /**
     * Save updated rules back to the API
     */
    const handleSave = async () => {
        setSaving(true);
        try {
            await referenceService.updatePlatformSetting('vat_rules', rules);
            toast.success('VAT rules updated successfully');
            setDirty(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to update VAT rules';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    /** Region badge styling */
    const regionBadge = (region: string) => {
        const isUAE = region === 'UAE';
        return (
            <span className={
                `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ` +
                (isUAE
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400')
            }>
                {region}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading VAT rules...</span>
            </div>
        );
    }

    if (rules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <ArrowRightLeft className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-lg font-medium">No VAT rules configured</p>
                <p className="text-sm mt-1">Insert the VAT rules into the platform_settings table to get started.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">VAT Rules</h2>
                    <p className="text-muted-foreground text-sm">
                        Configure VAT percentages per trade scenario. Only the VAT % fields are editable.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="min-w-[140px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="h-12 px-4">#</th>
                            <th className="h-12 px-4">Scenario</th>
                            <th className="h-12 px-4">Source Region</th>
                            <th className="h-12 px-4 text-center">→</th>
                            <th className="h-12 px-4">Destination Region</th>
                            <th className="h-12 px-4 text-right">Vendor → Admin VAT %</th>
                            <th className="h-12 px-4 text-right">Admin → Customer VAT %</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {rules.map((rule) => (
                            <tr key={rule.id} className="border-b transition-colors hover:bg-muted/50">
                                {/* ID */}
                                <td className="p-4 align-middle text-muted-foreground font-mono text-xs">
                                    {rule.id}
                                </td>

                                {/* Scenario */}
                                <td className="p-4 align-middle font-semibold">
                                    {rule.scenario}
                                </td>

                                {/* Source Region */}
                                <td className="p-4 align-middle">
                                    {regionBadge(rule.source_region)}
                                </td>

                                {/* Arrow */}
                                <td className="p-4 align-middle text-center text-muted-foreground">
                                    <ArrowRightLeft className="h-4 w-4 inline-block" />
                                </td>

                                {/* Destination Region */}
                                <td className="p-4 align-middle">
                                    {regionBadge(rule.destination_region)}
                                </td>

                                {/* Vendor → Admin VAT % */}
                                <td className="p-4 align-middle text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.5}
                                            value={rule.vendor_to_admin_vat_percent}
                                            onChange={(e) => handleChange(rule.id, 'vendor_to_admin_vat_percent', e.target.value)}
                                            className="w-20 text-right rounded-md border bg-background px-2 py-1.5 text-sm font-medium
												text-foreground dark:bg-gray-800 dark:text-gray-100
												focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <span className="text-muted-foreground text-xs">%</span>
                                    </div>
                                </td>

                                {/* Admin → Customer VAT % */}
                                <td className="p-4 align-middle text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.5}
                                            value={rule.admin_to_customer_vat_percent}
                                            onChange={(e) => handleChange(rule.id, 'admin_to_customer_vat_percent', e.target.value)}
                                            className="w-20 text-right rounded-md border bg-background px-2 py-1.5 text-sm font-medium
												text-foreground dark:bg-gray-800 dark:text-gray-100
												focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <span className="text-muted-foreground text-xs">%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Info Note */}
            <div className="mt-4 rounded-md bg-muted/40 border border-border/60 px-4 py-3 text-xs text-muted-foreground">
                <strong>Regions:</strong>{' '}
                <span className="font-medium">UAE</span> = United Arab Emirates&nbsp;|&nbsp;
                <span className="font-medium">ROW</span> = Rest of World.
                Changes take effect after saving.
            </div>
        </div>
    );
}
