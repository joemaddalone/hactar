import type { LibraryScanResult, Show, Season } from "../../types";
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
					// Check if this is a show (has seasons property)
					const isShow = "seasons" in item && Array.isArray((item as Show).seasons);

					allItems.push({
						title: item.title || "Untitled",
						size: item.humanBytes || "0 B",
						files: item.files || 0,
						library: lib.title,
						bytes: item.bytes || 0,
						sourceType: isShow ? "show" : "movie",
						sourceKey: item.ratingKey,
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

	return data.data.map((item) => {
		// Check if this is a show (has seasons property)
		const isShow = "seasons" in item && Array.isArray((item as Show).seasons);

		return {
			title: item.title || "Untitled",
			size: item.humanBytes || "0 B",
			files: item.files || 0,
			bytes: item.bytes || 0,
			sourceType: isShow ? "show" : "movie",
			sourceKey: item.ratingKey,
		};
	});
}

/**
 * Collects seasons from a show
 */
export function collectSeasonItems(show: Show): DashboardItem[] {
	if (!show.seasons || show.seasons.length === 0) {
		return [];
	}

	return show.seasons.map((season) => ({
		title: season.title || `Season ${season.seasonIndex}`,
		size: season.humanBytes || "0 B",
		files: season.files || 0,
		bytes: season.bytes || 0,
		index: season.seasonIndex || 0,
		sourceType: "season" as const,
		sourceKey: season.ratingKey,
	}));
}

/**
 * Collects episodes from a season
 */
export function collectEpisodeItems(season: Season): DashboardItem[] {
	if (!season.episodes || season.episodes.length === 0) {
		return [];
	}

	return season.episodes.map((episode) => ({
		title: episode.title || `Episode ${episode.episodeIndex}`,
		size: episode.humanBytes || "0 B",
		files: episode.files || 0,
		bytes: episode.bytes || 0,
		index: episode.episodeIndex || 0,
		sourceType: "episode" as const,
		sourceKey: episode.ratingKey,
	}));
}

/**
 * Truncates a title to the specified maximum length
 */
export function truncateTitle(title: string, maxLength: number = 30): string {
	if (title.length <= maxLength) return title;
	return `${title.slice(0, maxLength - 3)}...`;
}
