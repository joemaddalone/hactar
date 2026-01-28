import type { NavigationState, CachedLibraryData, DashboardWidgets, DashboardItem, ViewType, SortColumn, SortDirection } from './types';
import type { LibraryScanResult, Show, Season } from '../../types';

export function cycleLibrary(
	navigationState: NavigationState,
	cachedLibraryData: CachedLibraryData[],
	widgets: DashboardWidgets | null,
	displayItems: (type: ViewType, data: CachedLibraryData[] | LibraryScanResult | null) => void
): void {
	const totalLibraries = cachedLibraryData.length + 1; // +1 for "All Libraries"
	navigationState.libraryIndex = (navigationState.libraryIndex + 1) % totalLibraries;

	if (widgets?.libraryList) {
		widgets.libraryList.select(navigationState.libraryIndex);
	}

	// Reset navigation state when switching libraries
	navigationState.currentShow = undefined;
	navigationState.currentSeason = undefined;

	if (navigationState.libraryIndex === 0) {
		displayItems("overall", cachedLibraryData);
	} else {
		const selectedLib = cachedLibraryData[navigationState.libraryIndex - 1];
		if (selectedLib?.data) {
			displayItems("library", selectedLib.data);
		}
	}
}

export function drillDown(
	currentItems: DashboardItem[],
	selectedTableIndex: number,
	findShowByKey: (key?: string) => Show | undefined,
	findSeasonByKey: (key?: string) => Season | undefined,
	displayItems: (type: ViewType, data: Show | Season) => void
): void {
	if (currentItems.length === 0) return;

	const selectedItem = currentItems[selectedTableIndex];
	if (!selectedItem) return;

	// Only shows and seasons can be drilled into
	if (selectedItem.sourceType === "show") {
		const show = findShowByKey(selectedItem.sourceKey);
		if (show) {
			displayItems("show", show);
		}
	} else if (selectedItem.sourceType === "season") {
		const season = findSeasonByKey(selectedItem.sourceKey);
		if (season) {
			displayItems("season", season);
		}
	}
	// Movies and episodes are leaf nodes - no drill-down
}

export function navigateBack(
	currentView: ViewType,
	navigationState: NavigationState,
	cachedLibraryData: CachedLibraryData[],
	widgets: DashboardWidgets | null,
	displayItems: (type: ViewType, data: CachedLibraryData[] | LibraryScanResult | Show) => void,
	setSortState: (column: SortColumn, direction: SortDirection) => void
): void {
	switch (currentView) {
		case "season":
			// Go back to show view
			if (navigationState.currentShow) {
				displayItems("show", navigationState.currentShow);
			}
			break;
		case "show":
			// Go back to library view
			if (navigationState.libraryIndex === 0) {
				setSortState("size", "desc");
				displayItems("overall", cachedLibraryData);
			} else {
				const lib = cachedLibraryData[navigationState.libraryIndex - 1];
				if (lib?.data) {
					setSortState("size", "desc");
					displayItems("library", lib.data);
				}
			}
			break;
		case "library":
			// Go back to overall view
			navigationState.libraryIndex = 0;
			if (widgets?.libraryList) {
				widgets.libraryList.select(0);
			}
			setSortState("size", "desc");
			displayItems("overall", cachedLibraryData);
			break;
		// "overall" is the root - can't go back further
	}
}

export function moveTableSelection(
	widgets: DashboardWidgets | null,
	direction: 'up' | 'down' | 'pageup' | 'pagedown' | 'home' | 'end',
	totalItems: number,
	itemsPerPage: number,
	selectedTableIndex: number
): number {
	if (!widgets?.itemsTable || totalItems === 0) return selectedTableIndex;

	let newIndex = selectedTableIndex;

	switch (direction) {
		case 'up':
			newIndex = Math.max(0, selectedTableIndex - 1);
			break;
		case 'down':
			newIndex = Math.min(totalItems - 1, selectedTableIndex + 1);
			break;
		case 'pageup':
			newIndex = Math.max(0, selectedTableIndex - itemsPerPage);
			break;
		case 'pagedown':
			newIndex = Math.min(totalItems - 1, selectedTableIndex + itemsPerPage);
			break;
		case 'home':
			newIndex = 0;
			break;
		case 'end':
			newIndex = totalItems - 1;
			break;
	}

	return newIndex;
}