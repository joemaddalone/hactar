import type * as blessed from "blessed";
import type { KeyboardCallbacks } from "./types";

/**
 * Sets up keyboard controls for the dashboard
 */
export function setupKeyboardControls(
	screen: blessed.Widgets.Screen,
	callbacks: KeyboardCallbacks,
): void {
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

	// Sorting controls
	screen.key(["1"], () => {
		callbacks.onSortByColumn("title");
	});

	screen.key(["2"], () => {
		callbacks.onSortByColumn("size");
	});

	screen.key(["3"], () => {
		callbacks.onSortByColumn("files");
	});

	screen.key(["4"], () => {
		const state = callbacks.getState();
		if (state.currentView === "overall") {
			callbacks.onSortByColumn("library");
		}
	});

	// Toggle sort direction
	screen.key(["r"], () => {
		callbacks.onToggleSortDirection();
	});

	// Return to overall view
	screen.key(["escape", "0"], () => {
		const state = callbacks.getState();
		if (state.currentView !== "overall") {
			callbacks.onReturnToOverall();
		}
	});
}
