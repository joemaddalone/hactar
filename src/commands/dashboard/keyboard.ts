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

	const keyResponseFactory = (keys: string[], callback: () => void) => {
		screen.key(keys, () => {
			const state = callbacks.getState();
			if (state.activeModal) return; // Skip if modal is open
			callback();
		});
	};
	// Table navigation controls
	keyResponseFactory(["up", "k"], callbacks.onTableUp);
	keyResponseFactory(["down", "j"], callbacks.onTableDown);

	// Enter key
	screen.key(["enter"], () => {
		const state = callbacks.getState();
		if (state.activeModal === 'scan') {
			// Handle scan modal Enter key
			callbacks.onScanModalEnter?.();
			return;
		}
		if (state.activeModal === 'configure') {
			// Handle configure modal Enter key
			callbacks.onConfigureModalEnter?.();
			return;
		}
		if (state.activeModal) return; // Skip if other modal is open
		// Drill-down navigation
		callbacks.onDrillDown();
	});

	// Back navigation
	keyResponseFactory(["backspace", "b"], callbacks.onNavigateBack);

	// Library cycling with Tab
	keyResponseFactory(["tab"], callbacks.onCycleLibrary);

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

	keyResponseFactory(["home", "w"], callbacks.onFirstPage);

	keyResponseFactory(["end"], callbacks.onLastPage);

	// Sorting controls - determine sort column dynamically based on current view
	const getSortColumn = (keyIndex: number): SortColumn => {
		const state = callbacks.getState();
		const { currentView, libraryType } = state;
		const { viewConfig } = displayItemsConfig(currentView, libraryType);
		const { columns } = viewConfig;

		return columns[keyIndex]?.key || columns[0].key;
	};

	// Sorting controls
	keyResponseFactory(["1"], () => callbacks.onSortByColumn(getSortColumn(0)));
	keyResponseFactory(["2"], () => callbacks.onSortByColumn(getSortColumn(1)));
	keyResponseFactory(["3"], () => callbacks.onSortByColumn(getSortColumn(2)));
	keyResponseFactory(["4"], () => callbacks.onSortByColumn(getSortColumn(3)));

	// Toggle sort direction
	keyResponseFactory(["r"], callbacks.onToggleSortDirection);

	// Return to overall view (keeping 0 as shortcut)
	keyResponseFactory(["0"], callbacks.onReturnToOverall);

	// Modal controls
	keyResponseFactory(["c"], callbacks.onOpenConfigureModal);
	keyResponseFactory(["s"], callbacks.onOpenScanModal);

	screen.key(["escape"], () => {
		callbacks.onCloseModal();
	});
}
