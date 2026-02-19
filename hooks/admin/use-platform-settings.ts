import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/admin.service";

/**
 * Fee matrix entry shape as stored in platform_settings.platform_fee_matrix
 */
export interface FeeMatrixEntry {
	buyer_type: 'standard' | 'premium';
	product_type: 'controlled' | 'uncontrolled';
	threshold: number;
	fee_below: number;
	fee_above: number;
}

/**
 * Parsed platform fee settings returned by usePlatformFeeSettings
 */
export interface PlatformFeeSettings {
	feeMatrix: FeeMatrixEntry[];
	premiumThreshold: number;
	premiumLookbackMonths: number;
}

/**
 * Hook to fetch and parse the platform fee settings.
 * The raw settings are fetched from the admin settings API and
 * the fee matrix JSON is parsed into typed objects.
 */
export const usePlatformFeeSettings = () => {
	return useQuery<PlatformFeeSettings>({
		queryKey: ["platform-fee-settings"],
		queryFn: async () => {
			const settings = await adminService.getPlatformSettings();

			let feeMatrix: FeeMatrixEntry[] = [];
			try {
				feeMatrix = JSON.parse(settings.platform_fee_matrix || '[]');
			} catch {
				console.error('[usePlatformFeeSettings] Failed to parse platform_fee_matrix');
			}

			return {
				feeMatrix,
				premiumThreshold: Number(settings.premium_threshold) || 15000,
				premiumLookbackMonths: Number(settings.premium_lookback_months) || 6,
			};
		},
		staleTime: 10 * 60 * 1000, // 10 minutes — fee config rarely changes
	});
};
