import { describe, it, expect, vi, beforeEach } from "vitest";
import { cycleLibrary, drillDown, navigateBack, moveTableSelection } from "./navigation";
import type { NavigationState, CachedLibraryData, DashboardWidgets } from "./types";

describe("navigation", () => {
	let navigationState: NavigationState;
	let cachedLibraryData: CachedLibraryData[];
	let widgets: DashboardWidgets;
	let displayItems: any;

	beforeEach(() => {
		navigationState = {
			level: "overall",
			libraryIndex: 0,
		};
		cachedLibraryData = [
			{ key: "1", title: "Movies", data: { libraryName: "Movies", libraryType: "movie", data: [], bytes: 0, files: 0, humanBytes: "0 B" } },
			{ key: "2", title: "TV Shows", data: { libraryName: "TV Shows", libraryType: "show", data: [], bytes: 0, files: 0, humanBytes: "0 B" } },
		];
		widgets = {
			libraryList: {
				select: vi.fn(),
			} as any,
			itemsTable: {
				select: vi.fn(),
			} as any,
		} as any;
		displayItems = vi.fn();
	});

	describe("cycleLibrary", () => {
		it("should cycle forward to the first library", () => {
			cycleLibrary(navigationState, cachedLibraryData, widgets, displayItems);
			expect(navigationState.libraryIndex).toBe(1);
			expect(widgets.libraryList.select).toHaveBeenCalledWith(1);
			expect(displayItems).toHaveBeenCalledWith("library", cachedLibraryData[0].data);
		});

		it("should cycle forward and wrap around to 'All Libraries'", () => {
			navigationState.libraryIndex = 2; // Last library
			cycleLibrary(navigationState, cachedLibraryData, widgets, displayItems);
			expect(navigationState.libraryIndex).toBe(0);
			expect(widgets.libraryList.select).toHaveBeenCalledWith(0);
			expect(displayItems).toHaveBeenCalledWith("overall", cachedLibraryData);
		});

		it("should reset show and season state", () => {
			navigationState.currentShow = {} as any;
			navigationState.currentSeason = {} as any;
			cycleLibrary(navigationState, cachedLibraryData, widgets, displayItems);
			expect(navigationState.currentShow).toBeUndefined();
			expect(navigationState.currentSeason).toBeUndefined();
		});
	});

	describe("drillDown", () => {
		it("should drill down into a show", () => {
			const currentItems = [{ sourceType: "show", sourceKey: "show1" }] as any;
			const findShowByKey = vi.fn().mockReturnValue({ title: "Show 1" });
			const findSeasonByKey = vi.fn();

			drillDown(currentItems, 0, findShowByKey as any, findSeasonByKey as any, displayItems);

			expect(findShowByKey).toHaveBeenCalledWith("show1");
			expect(displayItems).toHaveBeenCalledWith("show", { title: "Show 1" });
		});

		it("should drill down into a season", () => {
			const currentItems = [{ sourceType: "season", sourceKey: "season1" }] as any;
			const findShowByKey = vi.fn();
			const findSeasonByKey = vi.fn().mockReturnValue({ title: "Season 1" });

			drillDown(currentItems, 0, findShowByKey as any, findSeasonByKey as any, displayItems);

			expect(findSeasonByKey).toHaveBeenCalledWith("season1");
			expect(displayItems).toHaveBeenCalledWith("season", { title: "Season 1" });
		});

		it("should do nothing for movies or episodes", () => {
			const currentItems = [{ sourceType: "movie" }, { sourceType: "episode" }] as any;
			const findByKey = vi.fn();

			drillDown(currentItems, 0, findByKey as any, findByKey as any, displayItems);
			drillDown(currentItems, 1, findByKey as any, findByKey as any, displayItems);

			expect(displayItems).not.toHaveBeenCalled();
		});
	});

	describe("navigateBack", () => {
		it("should navigate back from season to show", () => {
			const show = { title: "Show 1" } as any;
			navigationState.currentShow = show;
			navigateBack("season", navigationState, cachedLibraryData, widgets, displayItems, vi.fn());
			expect(displayItems).toHaveBeenCalledWith("show", show);
		});

		it("should navigate back from show to library", () => {
			navigationState.libraryIndex = 1;
			const setSortState = vi.fn();
			navigateBack("show", navigationState, cachedLibraryData, widgets, displayItems, setSortState);
			expect(setSortState).toHaveBeenCalledWith("size", "desc");
			expect(displayItems).toHaveBeenCalledWith("library", cachedLibraryData[0].data);
		});

		it("should navigate back from library to overall", () => {
			navigationState.libraryIndex = 1;
			const setSortState = vi.fn();
			navigateBack("library", navigationState, cachedLibraryData, widgets, displayItems, setSortState);
			expect(navigationState.libraryIndex).toBe(0);
			expect(widgets.libraryList.select).toHaveBeenCalledWith(0);
			expect(displayItems).toHaveBeenCalledWith("overall", cachedLibraryData);
		});
	});

	describe("moveTableSelection", () => {
		const totalItems = 100;
		const itemsPerPage = 20;

		it("should move selection down", () => {
			const index = moveTableSelection(widgets, "down", totalItems, itemsPerPage, 0);
			expect(index).toBe(1);
		});

		it("should move selection up", () => {
			const index = moveTableSelection(widgets, "up", totalItems, itemsPerPage, 5);
			expect(index).toBe(4);
		});

		it("should not move selection above 0", () => {
			const index = moveTableSelection(widgets, "up", totalItems, itemsPerPage, 0);
			expect(index).toBe(0);
		});

		it("should not move selection below last item", () => {
			const index = moveTableSelection(widgets, "down", totalItems, itemsPerPage, 99);
			expect(index).toBe(99);
		});

		it("should move selection pagedown", () => {
			const index = moveTableSelection(widgets, "pagedown", totalItems, itemsPerPage, 0);
			expect(index).toBe(20);
		});

		it("should move selection pageup", () => {
			const index = moveTableSelection(widgets, "pageup", totalItems, itemsPerPage, 30);
			expect(index).toBe(10);
		});

		it("should move selection to home", () => {
			const index = moveTableSelection(widgets, "home", totalItems, itemsPerPage, 50);
			expect(index).toBe(0);
		});

		it("should move selection to end", () => {
			const index = moveTableSelection(widgets, "end", totalItems, itemsPerPage, 50);
			expect(index).toBe(99);
		});
	});
});
