import type { LibraryScanResult } from "../../types";
import type { CachedLibraryData, DashboardItem } from "./types";

/**
 * Collects all items from all libraries for the overall view
 */
export function collectOverallItems(
	libraryData: CachedLibraryData[],
): DashboardItem[] {
	const allItems: DashboardItem[] = [];

	for (const lib of libraryData) {
		if (lib.data?.data) {
			for (const item of lib.data.data) {
				if (item) {
					allItems.push({
						title: item.title || "Untitled",
						size: item.humanBytes || "0 B",
						files: item.files || 0,
						library: lib.title,
						bytes: item.bytes || 0,
					});
				}
			}
		}
	}

	return allItems;
}

/**
 * Collects items from a single library
 */
export function collectLibraryItems(data: LibraryScanResult): DashboardItem[] {
	if (!data.data || data.data.length === 0) {
		return [];
	}

	return data.data.map((item) => ({
		title: item.title || "Untitled",
		size: item.humanBytes || "0 B",
		files: item.files || 0,
		bytes: item.bytes || 0,
	}));
}

/**
 * Truncates a title to the specified maximum length
 */
export function truncateTitle(title: string, maxLength: number = 30): string {
	if (title.length <= maxLength) return title;
	return `${title.slice(0, maxLength - 3)}...`;
}
