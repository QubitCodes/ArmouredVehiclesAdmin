'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { referenceService } from '@/services/admin/reference.service';
import { authService } from '@/services/admin/auth.service';

/**
 * Shape of a single fee matrix row from platform_settings.platform_fee_matrix
 */
interface FeeMatrixEntry {
	buyer_type: 'standard' | 'premium';
	product_type: 'controlled' | 'uncontrolled';
	threshold: number;
	fee_below: number;
	fee_above: number;
}

/**
 * PlatformFeesPanel — Displays the platform fee matrix and related settings
 * in an editable table with a Save button, following the same pattern as VatRulesPanel.
 */
export function PlatformFeesPanel() {
	const [feeMatrix, setFeeMatrix] = useState<FeeMatrixEntry[]>([]);
	const [premiumThreshold, setPremiumThreshold] = useState<number>(15000);
	const [premiumLookbackMonths, setPremiumLookbackMonths] = useState<number>(6);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

	/** Only super_admin can edit the fee settings */
	const isSuperAdmin = useMemo(() => {
		const user = authService.getUserDetails();
		return user?.userType === 'super_admin';
	}, []);

	/**
	 * Fetch all three platform settings keys related to fees
	 */
	const loadSettings = useCallback(async () => {
		setLoading(true);
		try {
			const [matrixRes, thresholdRes, lookbackRes] = await Promise.all([
				referenceService.getPlatformSetting('platform_fee_matrix'),
				referenceService.getPlatformSetting('premium_threshold'),
				referenceService.getPlatformSetting('premium_lookback_months'),
			]);

			if (Array.isArray(matrixRes.value)) {
				setFeeMatrix(matrixRes.value);
			} else if (typeof matrixRes.value === 'string') {
				setFeeMatrix(JSON.parse(matrixRes.value));
			}

			setPremiumThreshold(Number(thresholdRes.value) || 15000);
			setPremiumLookbackMonths(Number(lookbackRes.value) || 6);
		} catch (error) {
			console.error('Failed to load platform fee settings:', error);
			toast.error('Failed to load platform fee settings');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	/**
	 * Handle fee matrix field change
	 */
	const handleMatrixChange = (
		index: number,
		field: 'threshold' | 'fee_below' | 'fee_above',
		value: string
	) => {
		const numValue = value === '' ? 0 : parseFloat(value);
		if (isNaN(numValue) || numValue < 0) return;
		if ((field === 'fee_below' || field === 'fee_above') && numValue > 100) return;

		setFeeMatrix(prev =>
			prev.map((entry, i) =>
				i === index ? { ...entry, [field]: numValue } : entry
			)
		);
		setDirty(true);
	};

	/**
	 * Save all three settings back to the API
	 */
	const handleSave = async () => {
		setSaving(true);
		try {
			await Promise.all([
				referenceService.updatePlatformSetting('platform_fee_matrix', feeMatrix),
				referenceService.updatePlatformSetting('premium_threshold', String(premiumThreshold)),
				referenceService.updatePlatformSetting('premium_lookback_months', String(premiumLookbackMonths)),
			]);
			toast.success('Platform fee settings updated successfully');
			setDirty(false);
		} catch (error: any) {
			const message = error?.response?.data?.message || 'Failed to update platform fee settings';
			toast.error(message);
		} finally {
			setSaving(false);
		}
	};

	/** Buyer type badge styling */
	const buyerBadge = (type: string) => {
		const isPremium = type === 'premium';
		return (
			<span className={
				`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ` +
				(isPremium
					? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
					: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400')
			}>
				{type}
			</span>
		);
	};

	/** Product type badge styling */
	const productBadge = (type: string) => {
		const isControlled = type === 'controlled';
		return (
			<span className={
				`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ` +
				(isControlled
					? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
					: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400')
			}>
				{type}
			</span>
		);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				<span className="ml-2 text-muted-foreground">Loading platform fee settings...</span>
			</div>
		);
	}

	if (feeMatrix.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<Percent className="h-10 w-10 mb-3 opacity-40" />
				<p className="text-lg font-medium">No fee matrix configured</p>
				<p className="text-sm mt-1">Insert the platform_fee_matrix into the platform_settings table to get started.</p>
			</div>
		);
	}

	/** Sort rows by fee_below descending (highest fee first) */
	const sortedMatrix = [...feeMatrix].sort((a, b) => b.fee_below - a.fee_below);

	return (
		<div>
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Platform Fee Breakup</h2>
					<p className="text-muted-foreground text-sm">
						Configure the fee percentages applied to store prices based on buyer type, product type, and cart total.
					</p>
				</div>
				{isSuperAdmin && (
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
				)}
			</div>

			{/* Fee Matrix Table */}
			<div className="border rounded-lg overflow-hidden">
				<table className="w-full text-sm text-left">
					<thead className="bg-muted/50 text-muted-foreground font-medium">
						<tr>
							<th className="h-12 px-4">#</th>
							<th className="h-12 px-4">Buyer Type</th>
							<th className="h-12 px-4">Product Type</th>
							<th className="h-12 px-4 text-right">Cart Threshold (AED)</th>
							<th className="h-12 px-4 text-right">Fee Below Threshold</th>
							<th className="h-12 px-4 text-right">Fee Above Threshold</th>
						</tr>
					</thead>
					<tbody className="[&_tr:last-child]:border-0">
						{sortedMatrix.map((entry, displayIdx) => {
							/* Find real index in original feeMatrix for editing */
							const realIdx = feeMatrix.findIndex(
								e => e.buyer_type === entry.buyer_type && e.product_type === entry.product_type
							);
							return (
								<tr key={`${entry.buyer_type}-${entry.product_type}`} className="border-b transition-colors hover:bg-muted/50">
									{/* Row Number */}
									<td className="p-4 align-middle text-muted-foreground font-mono text-xs">
										{displayIdx + 1}
									</td>

									{/* Buyer Type */}
									<td className="p-4 align-middle">
										{buyerBadge(entry.buyer_type)}
									</td>

									{/* Product Type */}
									<td className="p-4 align-middle">
										{productBadge(entry.product_type)}
									</td>

									{/* Cart Threshold */}
									<td className="p-4 align-middle text-right">
										{isSuperAdmin ? (
											<div className="inline-flex items-center gap-1">
												<input
													type="number"
													min={0}
													step={500}
													value={entry.threshold}
													onChange={(e) => handleMatrixChange(realIdx, 'threshold', e.target.value)}
													className="w-28 text-right rounded-md border bg-background px-2 py-1.5 text-sm font-medium
														text-foreground dark:bg-gray-800 dark:text-gray-100
														focus:outline-none focus:ring-2 focus:ring-primary/50"
												/>
												<span className="text-muted-foreground text-xs">AED</span>
											</div>
										) : (
											<span className="font-mono">{entry.threshold.toLocaleString()} AED</span>
										)}
									</td>

									{/* Fee Below Threshold */}
									<td className="p-4 align-middle text-right">
										{isSuperAdmin ? (
											<div className="inline-flex items-center gap-1">
												<input
													type="number"
													min={0}
													max={100}
													step={0.5}
													value={entry.fee_below}
													onChange={(e) => handleMatrixChange(realIdx, 'fee_below', e.target.value)}
													className="w-20 text-right rounded-md border bg-background px-2 py-1.5 text-sm font-medium
														text-foreground dark:bg-gray-800 dark:text-gray-100
														focus:outline-none focus:ring-2 focus:ring-primary/50"
												/>
												<span className="text-muted-foreground text-xs">%</span>
											</div>
										) : (
											<span className="font-mono">{entry.fee_below}%</span>
										)}
									</td>

									{/* Fee Above Threshold */}
									<td className="p-4 align-middle text-right">
										{isSuperAdmin ? (
											<div className="inline-flex items-center gap-1">
												<input
													type="number"
													min={0}
													max={100}
													step={0.5}
													value={entry.fee_above}
													onChange={(e) => handleMatrixChange(realIdx, 'fee_above', e.target.value)}
													className="w-20 text-right rounded-md border bg-background px-2 py-1.5 text-sm font-medium
														text-foreground dark:bg-gray-800 dark:text-gray-100
														focus:outline-none focus:ring-2 focus:ring-primary/50"
												/>
												<span className="text-muted-foreground text-xs">%</span>
											</div>
										) : (
											<span className="font-mono">{entry.fee_above}%</span>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Premium Buyer Settings */}
			<div className="mt-6 border rounded-lg p-5">
				<h3 className="text-sm font-semibold mb-4">Premium Buyer Qualification</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Lookback Months */}
					<div>
						<label className="block text-xs font-medium text-muted-foreground mb-1.5">
							Lookback Period (Months)
						</label>
						<p className="text-xs text-muted-foreground/70 mb-2">
							How many months of order history to consider for premium qualification.
						</p>
						{isSuperAdmin ? (
							<div className="inline-flex items-center gap-2">
								<input
									id="lookback-months-input"
									type="number"
									min={1}
									max={60}
									step={1}
									value={premiumLookbackMonths}
									onChange={(e) => {
										const v = parseInt(e.target.value, 10);
										if (!isNaN(v) && v >= 1) {
											setPremiumLookbackMonths(v);
											setDirty(true);
										}
									}}
									className="w-24 rounded-md border bg-background px-3 py-2 text-sm font-medium
										text-foreground dark:bg-gray-800 dark:text-gray-100
										focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
								<span className="text-sm text-muted-foreground">months</span>
							</div>
						) : (
							<p className="text-sm font-medium">{premiumLookbackMonths} months</p>
						)}
					</div>

					{/* Premium Threshold */}
					<div>
						<label className="block text-xs font-medium text-muted-foreground mb-1.5">
							Spend Threshold
						</label>
						<p className="text-xs text-muted-foreground/70 mb-2">
							Total amount spent in the <strong className="text-muted-foreground cursor-pointer underline decoration-dotted" onClick={() => document.getElementById('lookback-months-input')?.focus()}>lookback period</strong> to qualify as a Premium buyer.
						</p>
						{isSuperAdmin ? (
							<div className="inline-flex items-center gap-2">
								<input
									type="number"
									min={0}
									step={1000}
									value={premiumThreshold}
									onChange={(e) => {
										const v = parseFloat(e.target.value);
										if (!isNaN(v) && v >= 0) {
											setPremiumThreshold(v);
											setDirty(true);
										}
									}}
									className="w-36 rounded-md border bg-background px-3 py-2 text-sm font-medium
										text-foreground dark:bg-gray-800 dark:text-gray-100
										focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
								<span className="text-sm text-muted-foreground">AED</span>
							</div>
						) : (
							<p className="text-sm font-medium">{premiumThreshold.toLocaleString()} AED</p>
						)}
					</div>
				</div>
			</div>

			{/* Info Note */}
			<div className="mt-4 rounded-md bg-muted/40 border border-border/60 px-4 py-3 text-xs text-muted-foreground">
				<strong>How it works:</strong>{' '}
				When a customer adds products to their cart, the platform applies a service fee on top of the vendor price.
				The fee percentage depends on the buyer&apos;s type (Standard or Premium), the product type (Controlled or Uncontrolled),
				and whether the cart total is below or above the configured threshold.
				Changes take effect after saving.
			</div>
		</div>
	);
}
