import { Command } from "commander";
import * as blessed from "blessed";
import { BaseCommand } from "../base-command";
import { PlexClient } from "../../client/plex";
import { StorageClient } from "../../client/storage";
import type { LibraryScanResult } from "../../types";

import { createLayout } from "./layout";
import { setupKeyboardControls } from "./keyboard";
import { sortItems } from "./sorting";
import { updateStorageChart } from "./storage-chart";
import { collectOverallItems, collectLibraryItems, truncateTitle } from "./views";
import type {
	CachedLibraryData,
	DashboardItem,
	DashboardWidgets,
	SortColumn,
	SortDirection,
	ViewType,
	KeyboardCallbacks,
} from "./types";

export class DashboardCommand extends BaseCommand {
	private screen: blessed.Widgets.Screen | null = null;
	private widgets: DashboardWidgets | null = null;

	// Pagination and sorting state
	private currentPage: number = 1;
	private itemsPerPage: number = 20;
	private totalItems: number = 0;
	private currentSortColumn: SortColumn = "size";
	private sortDirection: SortDirection = "desc";
	private selectedLibrary: string | null = null;
	private currentItems: DashboardItem[] = [];
	private currentView: ViewType = "overall";
	private cachedLibraryData: CachedLibraryData[] = [];

	protected createCommand(): Command {
		return new Command("dashboard")
			.description("Open the Hactar TUI dashboard")
			.action(async () => {
				await this.runWithErrorHandling();
			});
	}

	protected async execute(): Promise<void> {
		// Check if we're in a TTY
		if (!process.stdout.isTTY) {
			this.logError("Dashboard requires a TTY. Please run from a terminal.");
			return;
		}

		const plexClient = new PlexClient();
		const storageClient = new StorageClient();

		// Check if we have credentials
		const isConfigured = await plexClient.testConnection();
		if (!isConfigured) {
			await this.offerConfiguration();
			return;
		}

		try {
			this.initScreen();
			await this.renderDashboard(storageClient);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			this.logError(`Dashboard error: ${errorMsg}`);
			if (error instanceof Error && error.stack) {
				console.error("Full error:", error.stack);
			}
			throw error;
		}
	}

	private initScreen(): void {
		try {
			this.screen = blessed.screen({
				smartCSR: true,
				title: "Hactar Dashboard",
				fullUnicode: false,
			});

			if (!this.screen) {
				throw new Error("Failed to create blessed screen");
			}

			this.screen.key(["q", "C-c"], () => {
				process.exit(0);
			});

			// Set up keyboard controls using the modular function
			setupKeyboardControls(this.screen, this.createKeyboardCallbacks());
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			this.logError(`Failed to initialize terminal UI: ${errorMsg}`);
			throw error;
		}
	}

	private createKeyboardCallbacks(): KeyboardCallbacks {
		return {
			onPreviousPage: () => {
				this.currentPage--;
				this.refreshItemsTable();
				this.updateStatusLog();
			},
			onNextPage: () => {
				this.currentPage++;
				this.refreshItemsTable();
				this.updateStatusLog();
			},
			onFirstPage: () => {
				this.currentPage = 1;
				this.refreshItemsTable();
				this.updateStatusLog();
			},
			onLastPage: () => {
				this.currentPage = Math.ceil(this.totalItems / this.itemsPerPage);
				this.refreshItemsTable();
				this.updateStatusLog();
			},
			onSortByColumn: (column: SortColumn) => {
				this.sortByColumn(column);
			},
			onToggleSortDirection: () => {
				this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
				this.sortByColumn(this.currentSortColumn);
			},
			onReturnToOverall: () => {
				if (this.widgets?.libraryList) {
					this.widgets.libraryList.select(0);
				}
				this.displayOverallItems(this.cachedLibraryData);
			},
			getState: () => ({
				currentPage: this.currentPage,
				totalItems: this.totalItems,
				itemsPerPage: this.itemsPerPage,
				currentView: this.currentView,
				currentSortColumn: this.currentSortColumn,
				sortDirection: this.sortDirection,
			}),
		};
	}

	private sortByColumn(column: SortColumn): void {
		if (column === "library" && this.currentView !== "overall") return;

		this.currentSortColumn = column;
		this.currentPage = 1; // Reset to first page when sorting

		// Sort items using the modular sorting function
		this.currentItems = sortItems(this.currentItems, column, this.sortDirection);

		this.refreshItemsTable();
		this.updateStatusLog();
	}

	private async renderDashboard(storageClient: StorageClient): Promise<void> {
		if (!this.screen) {
			throw new Error("Screen not initialized");
		}

		try {
			// Create the multi-panel layout using the modular function
			this.widgets = createLayout(this.screen);

			// Load and display data
			await this.loadDashboardData(storageClient);

			// Initial render
			this.screen.render();
		} catch (error) {
			this.logError(
				`Error rendering dashboard: ${error instanceof Error ? error.message : String(error)}`,
			);
			if (error instanceof Error && error.stack) {
				console.error(error.stack);
			}
			throw error;
		}
	}

	private async loadDashboardData(storageClient: StorageClient): Promise<void> {
		if (!this.widgets) return;

		const { libraryList, storageChart, statusLog } = this.widgets;

		statusLog.setContent("Loading cached library data...");

		try {
			// get libraries from storage
			const libraries = await storageClient.getLibraries();

			if (!libraries || libraries.length === 0) {
				statusLog.setContent("No libraries found. Run 'hactar scan' first.");
				return;
			}

			// Load cached data for each library
			this.cachedLibraryData = [];
			let totalSize = 0;
			let totalFiles = 0;

			for (const lib of libraries) {
				const data = await storageClient.getLibraryData(lib.key);
				this.cachedLibraryData.push({
					key: lib.key,
					title: lib.libraryName || "Untitled",
					data: data,
				});

				if (data) {
					totalSize += data.bytes;
					totalFiles += data.files;
				}
			}

			// Update library list with "All Libraries" option at the top
			libraryList.setItems([
				"[ All Libraries ]",
				...this.cachedLibraryData.map((lib) => lib.title),
			]);

			// Update storage chart with overall metrics
			updateStorageChart(storageChart, totalSize, totalFiles, this.cachedLibraryData);

			// Set up library selection handler
			libraryList.on("select", (_item, index) => {
				if (index === 0) {
					this.displayOverallItems(this.cachedLibraryData);
					return;
				}

				const selectedLib = this.cachedLibraryData[index - 1];
				if (selectedLib?.data) {
					this.displayLibraryItems(selectedLib.data);
				} else {
					this.widgets?.statusLog.setContent(
						`No cached data for ${selectedLib.title}. Run 'hactar scan ${selectedLib.key}' first.`,
					);
				}
			});

			// Show overall view initially
			this.displayOverallItems(this.cachedLibraryData);
			this.updateStatusLog();
		} catch (error) {
			statusLog.setContent(
				`Error loading data: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	private displayOverallItems(libraryData: CachedLibraryData[]): void {
		if (!this.widgets?.itemsTable) return;

		this.currentView = "overall";
		this.currentPage = 1;

		// Collect items using the modular function
		this.currentItems = collectOverallItems(libraryData);
		this.totalItems = this.currentItems.length;

		// Sort by current column and direction
		this.sortByColumn(this.currentSortColumn);
	}

	private displayLibraryItems(data: LibraryScanResult): void {
		if (!this.widgets?.itemsTable) return;

		this.currentView = "library";
		this.currentPage = 1;
		this.currentSortColumn = "size";
		this.sortDirection = "desc";

		// Collect items using the modular function
		this.currentItems = collectLibraryItems(data);
		this.totalItems = this.currentItems.length;

		if (this.currentItems.length === 0) {
			this.refreshItemsTable();
			this.updateStatusLog();
			return;
		}

		this.selectedLibrary = data.libraryName;

		// Sort by current column and direction
		this.sortByColumn(this.currentSortColumn);
	}

	private refreshItemsTable(): void {
		if (!this.widgets?.itemsTable) return;

		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const pageItems = this.currentItems.slice(startIndex, endIndex);

		// Prepare table data with header
		const header =
			this.currentView === "overall"
				? ["Title", "Size", "Files", "Library"]
				: ["Title", "Size", "Files"];

		// Add sort indicators to header
		const sortIndicator = this.sortDirection === "asc" ? " ↑" : " ↓";
		const headerWithSort = [...header];
		const sortColumnIndex =
			this.currentView === "overall"
				? ["title", "size", "files", "library"].indexOf(this.currentSortColumn)
				: ["title", "size", "files"].indexOf(this.currentSortColumn);

		if (sortColumnIndex >= 0) {
			headerWithSort[sortColumnIndex] += sortIndicator;
		}

		const tableData = [headerWithSort];

		for (const item of pageItems) {
			const row = [truncateTitle(item.title), item.size, String(item.files)];

			if (this.currentView === "overall" && item.library) {
				row.push(truncateTitle(item.library, 15));
			}

			tableData.push(row);
		}

		this.widgets.itemsTable.setData(tableData);
		this.screen?.render();
	}

	private updateStatusLog(): void {
		if (!this.widgets?.statusLog) return;

		const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
		const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
		const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

		const status = [
			`View: ${this.currentView === "overall" ? "All Libraries" : this.selectedLibrary}`,
			`Items: ${startItem}-${endItem} of ${this.totalItems}`,
			`Page: ${this.currentPage}/${maxPage}`,
			`Sort: ${this.currentSortColumn} (${this.sortDirection})`,
			"",
			"Controls:",
			"←/→ or A/D: Navigate pages | Home/End or W/S: First/Last page",
			"1-3: Sort by column | 0/Esc: Overall View | R: Reverse sort | Q: Quit",
		];

		this.widgets.statusLog.setContent(status.join("\n"));
		this.screen?.render();
	}
}
