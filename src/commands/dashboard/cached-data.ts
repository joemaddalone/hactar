import type { CachedLibraryData } from "./types";
import type { LibraryScanResult, Show, Season } from "../../types";

interface StorageClientInterface {
	getLibraries(): Promise<Array<{ key: string; libraryName?: string; }>>;
	getLibraryData(key: string): Promise<LibraryScanResult | null>;
}

export async function loadCachedData(storageClient: StorageClientInterface): Promise<CachedLibraryData[]> {
	// Get libraries from storage
	const libraries = await storageClient.getLibraries();

	if (!libraries || libraries.length === 0) {
		return [];
	}

	// Load cached data for each library
	const cachedLibraryData: CachedLibraryData[] = [];

	for (const lib of libraries) {
		const data = await storageClient.getLibraryData(lib.key);
		cachedLibraryData.push({
			key: lib.key,
			title: lib.libraryName || "Untitled",
			data: data,
		});
	}

	return cachedLibraryData;
}

export function findShowByKey(key: string | undefined, cachedLibraryData: CachedLibraryData[]): Show | undefined {
	if (!key) return undefined;

	for (const library of cachedLibraryData) {
		if (!library.data?.data) continue;

		const item = library.data.data.find((item) => item.ratingKey === key);
		if (item && 'seasons' in item) {
			return item as Show;
		}
	}

	return undefined;
}

export function findSeasonByKey(key: string | undefined, cachedLibraryData: CachedLibraryData[]): Season | undefined {
	if (!key) return undefined;

	for (const library of cachedLibraryData) {
		if (!library.data?.data) continue;

		for (const item of library.data.data) {
			if ('seasons' in item) {
				const show = item as Show;
				if (!show.seasons) continue;

				const season = show.seasons.find(season => season.ratingKey === key);
				if (season) return season;
			}
		}
	}

	return undefined;
}