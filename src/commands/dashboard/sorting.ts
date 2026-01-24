import type { DashboardItem, SortColumn, SortDirection } from "./types";

/**
 * Sorts dashboard items by the specified column and direction
 * Returns a new sorted array (does not mutate original)
 */
export function sortItems(
	items: DashboardItem[],
	column: SortColumn,
	direction: SortDirection,
): DashboardItem[] {
	return [...items].sort((a, b) => {
		let aValue: string | number;
		let bValue: string | number;

		switch (column) {
			case "index":
				aValue = a.index || 0;
				bValue = b.index || 0;
				break;
			case "title":
				aValue = a.title.toLowerCase();
				bValue = b.title.toLowerCase();
				break;
			case "size":
				aValue = a.bytes || parseSize(a.size);
				bValue = b.bytes || parseSize(b.size);
				break;
			case "episodes":
				aValue = a.episodes;
				bValue = b.episodes;
				break;
			case "library":
				aValue = a.library?.toLowerCase() || "";
				bValue = b.library?.toLowerCase() || "";
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return direction === "asc" ? -1 : 1;
		if (aValue > bValue) return direction === "asc" ? 1 : -1;
		return 0;
	});
}

/**
 * Parses a human-readable size string to bytes
 * E.g., "123 MB" -> 123000000
 */
export function parseSize(sizeStr: string): number {
	const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/);
	if (!match) return 0;

	const value = parseFloat(match[1]);
	const unit = match[2];

	const multipliers = {
		B: 1,
		KB: 1000,
		MB: 1000000,
		GB: 1000000000,
		TB: 1000000000000,
	};

	return value * (multipliers[unit as keyof typeof multipliers] || 1);
}
