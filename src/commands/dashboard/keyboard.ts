import type * as blessed from "blessed";
import type { KeyboardCallbacks, SortColumn } from "./types";
import { displayItemsConfig } from "./display-items-config";

/**
 * Sets up keyboard controls for the dashboard
 */
export function setupKeyboardControls(
	screen: blessed.Widgets.Screen,
	callbacks: KeyboardCallbacks,
): void {
	// Table navigation controls
	screen.key(["up", "k"], () => {
		callbacks.onTableUp();
	});

	screen.key(["down", "j"], () => {
		callbacks.onTableDown();
	});

	// Drill-down navigation
	screen.key(["enter"], () => {
		callbacks.onDrillDown();
	});

	// Back navigation
	screen.key(["backspace", "b"], () => {
		callbacks.onNavigateBack();
	});

	// Library cycling with Tab
	screen.key(["tab"], () => {
		callbacks.onCycleLibrary();
	});

	// Pagination controls
	screen.key(["left", "a"], () => {
		const state = callbacks.getState();
		if (state.currentPage > 1) {
			callbacks.onPreviousPage();
		}
	});

	screen.key(["right", "d"], () => {
		const state = callbacks.getState();
		const maxPage = Math.ceil(state.totalItems / state.itemsPerPage);
		if (state.currentPage < maxPage) {
			callbacks.onNextPage();
		}
	});

	screen.key(["home", "w"], () => {
		callbacks.onFirstPage();
	});

	screen.key(["end", "s"], () => {
		callbacks.onLastPage();
	});

	// Sorting controls - determine sort column dynamically based on current view
	const getSortColumn = (keyIndex: number): SortColumn => {
		const state = callbacks.getState();
		const { currentView, libraryType } = state;
		const { viewConfig } = displayItemsConfig(currentView, libraryType);
		const { columns } = viewConfig;

		return columns[keyIndex]?.key || columns[0].key;
	};

	screen.key(["1"], () => {
		callbacks.onSortByColumn(getSortColumn(0));
	});

	screen.key(["2"], () => {
		callbacks.onSortByColumn(getSortColumn(1));
	});

	screen.key(["3"], () => {
		callbacks.onSortByColumn(getSortColumn(2));
	});

	screen.key(["4"], () => {
		callbacks.onSortByColumn(getSortColumn(3));
	});

	// Toggle sort direction
	screen.key(["r"], () => {
		callbacks.onToggleSortDirection();
	});

	// Return to overall view (keeping 0 as shortcut)
	screen.key(["0"], () => {
		callbacks.onReturnToOverall();
	});
}
