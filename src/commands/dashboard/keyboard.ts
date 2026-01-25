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
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onTableUp();
	});

	screen.key(["down", "j"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onTableDown();
	});

	// Drill-down navigation
	screen.key(["enter"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onDrillDown();
	});

	// Back navigation
	screen.key(["backspace", "b"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onNavigateBack();
	});

	// Library cycling with Tab
	screen.key(["tab"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onCycleLibrary();
	});

	// Pagination controls
	screen.key(["left", "a"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		if (state.currentPage > 1) {
			callbacks.onPreviousPage();
		}
	});

	screen.key(["right", "d"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		const maxPage = Math.ceil(state.totalItems / state.itemsPerPage);
		if (state.currentPage < maxPage) {
			callbacks.onNextPage();
		}
	});

	screen.key(["home", "w"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onFirstPage();
	});

	screen.key(["end"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
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
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onSortByColumn(getSortColumn(0));
	});

	screen.key(["2"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onSortByColumn(getSortColumn(1));
	});

	screen.key(["3"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onSortByColumn(getSortColumn(2));
	});

	screen.key(["4"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onSortByColumn(getSortColumn(3));
	});

	// Toggle sort direction
	screen.key(["r"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onToggleSortDirection();
	});

	// Return to overall view (keeping 0 as shortcut)
	screen.key(["0"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is open
		callbacks.onReturnToOverall();
	});

	// Modal controls
	screen.key(["c"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is already open
		callbacks.onOpenConfigureModal();
	});

	screen.key(["s"], () => {
		const state = callbacks.getState();
		if (state.activeModal) return; // Skip if modal is already open
		callbacks.onOpenScanModal();
	});

	screen.key(["escape"], () => {
		callbacks.onCloseModal();
	});
}
