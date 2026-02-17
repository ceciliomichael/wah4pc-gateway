/**
 * NCR Region Code constant.
 * NCR has no provinces in the PSGC — cities are direct children of the region.
 * Forms should skip the Province dropdown when this region is selected.
 */
export const NCR_REGION_CODE = "130000000";

/**
 * Check if a region code is NCR (National Capital Region).
 * NCR skips the Province level — users go directly from Region to City/Municipality.
 */
export function isNCR(regionCode: string): boolean {
	return regionCode === NCR_REGION_CODE;
}