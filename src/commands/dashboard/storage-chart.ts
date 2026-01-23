import type * as blessed from "blessed";
import { bytesToHuman } from "../../utils/bytes";
import type { CachedLibraryData } from "./types";

/**
 * Updates the storage chart with overall metrics
 */
export function updateStorageChart(
	storageChart: blessed.Widgets.BoxElement,
	totalSize: number,
	totalFiles: number,
	libraryData: CachedLibraryData[],
): void {
	const content = [
		`Total Storage: ${bytesToHuman(totalSize)}`,
		`Total Files: ${totalFiles.toLocaleString()}`,
		"",
		"Largest Libraries:",
	];

	// Sort libraries by size and show top 5
	const sortedLibs = libraryData
		.filter((lib) => lib.data)
		.sort((a, b) => (b.data?.bytes || 0) - (a.data?.bytes || 0))
		.slice(0, 5);

	for (const lib of sortedLibs) {
		if (lib.data) {
			content.push(`${lib.title}: ${bytesToHuman(lib.data.bytes)}`);
		}
	}

	storageChart.setContent(content.join("\n"));
}
