import { Command } from "commander";
import * as blessed from "blessed";
import { BaseCommand } from "./base-command";
import { PlexClient } from "../client/plex";
import { StorageClient } from "../client/storage";
import type { LibraryScanResult } from "../types";
import { bytesToHuman } from "../utils/bytes";

export class DashboardCommand extends BaseCommand {
	private screen: blessed.Widgets.Screen | null = null;
	private libraryList: blessed.Widgets.ListElement | null = null;
	private storageChart: blessed.Widgets.BoxElement | null = null;
	private itemsTable: blessed.Widgets.ListTableElement | null = null;
	private statusLog: blessed.Widgets.BoxElement | null = null;

	// Pagination and sorting state
	private currentPage: number = 1;
	private itemsPerPage: number = 20;
	private totalItems: number = 0;
	private currentSortColumn: string = "size";
	private sortDirection: "asc" | "desc" = "desc";
	private currentItems: Array<{
		title: string;
		size: string;
		files: number;
		library?: string;
		bytes?: number;
	}> = [];
	private currentView: "overall" | "library" = "overall";

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

			// Add pagination and sorting keyboard controls
			this.setupKeyboardControls();
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			this.logError(`Failed to initialize terminal UI: ${errorMsg}`);
			throw error;
		}
	}

	private setupKeyboardControls(): void {
		if (!this.screen) return;

		// Pagination controls
		this.screen.key(["left", "a"], () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.refreshItemsTable();
				this.updateStatusLog();
			}
		});

		this.screen.key(["right", "d"], () => {
			const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
			if (this.currentPage < maxPage) {
				this.currentPage++;
				this.refreshItemsTable();
				this.updateStatusLog();
			}
		});

		this.screen.key(["home", "w"], () => {
			this.currentPage = 1;
			this.refreshItemsTable();
			this.updateStatusLog();
		});

		this.screen.key(["end", "s"], () => {
			this.currentPage = Math.ceil(this.totalItems / this.itemsPerPage);
			this.refreshItemsTable();
			this.updateStatusLog();
		});

		// Sorting controls
		this.screen.key(["1"], () => {
			this.sortByColumn("title");
		});

		this.screen.key(["2"], () => {
			this.sortByColumn("size");
		});

		this.screen.key(["3"], () => {
			this.sortByColumn("files");
		});

		this.screen.key(["4"], () => {
			if (this.currentView === "overall") {
				this.sortByColumn("library");
			}
		});

		// Toggle sort direction
		this.screen.key(["r"], () => {
			this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
			this.sortByColumn(this.currentSortColumn);
		});
	}

	private sortByColumn(column: string): void {
		if (column === "library" && this.currentView !== "overall") return;

		this.currentSortColumn = column;
		this.currentPage = 1; // Reset to first page when sorting

		// Sort the items
		this.currentItems.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			switch (column) {
				case "title":
					aValue = a.title.toLowerCase();
					bValue = b.title.toLowerCase();
					break;
				case "size":
					aValue = a.bytes || this.parseSize(a.size);
					bValue = b.bytes || this.parseSize(b.size);
					break;
				case "files":
					aValue = a.files;
					bValue = b.files;
					break;
				case "library":
					aValue = a.library?.toLowerCase() || "";
					bValue = b.library?.toLowerCase() || "";
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1;
			if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		this.refreshItemsTable();
		this.updateStatusLog();
	}

	private async renderDashboard(storageClient: StorageClient): Promise<void> {
		if (!this.screen) {
			throw new Error("Screen not initialized");
		}

		try {
			// Create the multi-panel layout
			this.createLayout();

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

	private createLayout(): void {
		if (!this.screen) return;

		// 1. Library List (left panel - 30% width)
		this.libraryList = blessed.list({
			parent: this.screen,
			label: "Libraries",
			top: 0,
			left: 0,
			width: "30%",
			height: "70%",
			keys: true,
			vi: true,
			invertSelected: true,
			border: { type: "line" },
			style: {
				selected: {
					fg: "black",
					bg: "cyan",
				},
			},
		});

		// 2. Storage Chart (top right - 70% width, 30% height)
		this.storageChart = blessed.box({
			parent: this.screen,
			label: "Storage Summary",
			top: 0,
			left: "30%",
			width: "70%",
			height: "30%",
			border: { type: "line" },
			scrollable: true,
			alwaysScroll: true,
		});

		// 3. Items Table (middle right - 70% width, 40% height)
		this.itemsTable = blessed.listtable({
			parent: this.screen,
			label: "Items by Size",
			top: "30%",
			left: "30%",
			width: "70%",
			height: "40%",
			keys: true,
			vi: true,
			border: { type: "line" },
			align: "left",
			style: {
				header: {
					fg: "cyan",
					bold: true,
				},
			},
		});

		// 4. Status Log (bottom - 100% width, 30% height)
		this.statusLog = blessed.box({
			parent: this.screen,
			label: "Activity Log",
			top: "70%",
			left: 0,
			width: "100%",
			height: "30%",
			border: { type: "line" },
			scrollable: true,
			alwaysScroll: true,
		});
	}

	private async loadDashboardData(storageClient: StorageClient): Promise<void> {
		if (
			!this.libraryList ||
			!this.storageChart ||
			!this.itemsTable ||
			!this.statusLog
		) {
			return;
		}

		if (this.statusLog) {
			this.statusLog.setContent("Loading cached library data...");
		}

		try {
			// Get all available libraries from Plex
			const libraries = await new PlexClient().getLibraries();

			if (!libraries || libraries.length === 0) {
				if (this.statusLog) {
					this.statusLog.setContent(
						"No libraries found. Run 'hactar scan' first.",
					);
				}
				return;
			}

			// Load cached data for each library
			const libraryData: Array<{
				key: string;
				title: string;
				data: LibraryScanResult | null;
			}> = [];
			let totalSize = 0;
			let totalFiles = 0;

			for (const lib of libraries) {
				const data = await storageClient.getLibraryData(lib.key);
				libraryData.push({
					key: lib.key,
					title: lib.title || "Untitled",
					data: data,
				});

				if (data) {
					totalSize += data.bytes;
					totalFiles += data.files;
				}
			}

			// Update library list
			this.libraryList.setItems(libraryData.map((lib) => lib.title));

			// Update storage chart with overall metrics
			this.updateStorageChart(totalSize, totalFiles, libraryData);

			// Set up library selection handler
			this.libraryList.on("select", (_item, index) => {
				const selectedLib = libraryData[index];
				if (selectedLib?.data) {
					this.displayLibraryItems(selectedLib.data);
					if (this.statusLog) {
						this.statusLog.setContent(`Selected library: ${selectedLib.title}`);
					}
				} else {
					if (this.statusLog) {
						this.statusLog.setContent(
							`No cached data for ${selectedLib.title}. Run 'hactar scan ${selectedLib.key}' first.`,
						);
					}
				}
			});

			// Show overall view initially
			this.displayOverallItems(libraryData);

			if (this.statusLog) {
				this.statusLog.setContent(
					`Loaded ${libraries.length} libraries, ${totalFiles} total files`,
				);
			}
		} catch (error) {
			if (this.statusLog) {
				this.statusLog.setContent(
					`Error loading data: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
	}

	private updateStorageChart(
		totalSize: number,
		totalFiles: number,
		libraryData: Array<{
			key: string;
			title: string;
			data: LibraryScanResult | null;
		}>,
	): void {
		if (!this.storageChart) return;

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

		this.storageChart.setContent(content.join("\n"));
	}

	private displayOverallItems(
		libraryData: Array<{
			key: string;
			title: string;
			data: LibraryScanResult | null;
		}>,
	): void {
		if (!this.itemsTable) return;

		this.currentView = "overall";
		this.currentPage = 1;

		// Collect all items from all libraries
		const allItems: Array<{
			title: string;
			size: string;
			files: number;
			library: string;
			bytes?: number;
		}> = [];

		for (const lib of libraryData) {
			if (lib.data?.data) {
				for (const item of lib.data.data) {
					if (item) {
						allItems.push({
							title: item.title || "Untitled",
							size: item.humanBytes || "0 B",
							files: item.files || 0,
							library: lib.title,
							bytes: item.bytes || 0,
						});
					}
				}
			}
		}

		// Set current items and total
		this.currentItems = allItems;
		this.totalItems = allItems.length;

		// Sort by current column and direction
		this.sortByColumn(this.currentSortColumn);
	}

	private displayLibraryItems(data: LibraryScanResult): void {
		if (!this.itemsTable) return;

		this.currentView = "library";
		this.currentPage = 1;

		if (!data.data || data.data.length === 0) {
			this.currentItems = [];
			this.totalItems = 0;
			this.refreshItemsTable();
			this.updateStatusLog();
			return;
		}

		// Convert to current items format
		const items: Array<{
			title: string;
			size: string;
			files: number;
			library?: string;
			bytes?: number;
		}> = data.data.map((item) => ({
			title: item.title || "Untitled",
			size: item.humanBytes || "0 B",
			files: item.files || 0,
			bytes: item.bytes || 0,
		}));

		// Set current items and total
		this.currentItems = items;
		this.totalItems = items.length;

		// Sort by current column and direction
		this.sortByColumn(this.currentSortColumn);
	}

	private refreshItemsTable(): void {
		if (!this.itemsTable) return;

		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		const pageItems = this.currentItems.slice(startIndex, endIndex);

		// Prepare table data with header
		const header = this.currentView === "overall"
			? ["Title", "Size", "Files", "Library"]
			: ["Title", "Size", "Files"];

		// Add sort indicators to header
		const sortIndicator = this.sortDirection === "asc" ? " ↑" : " ↓";
		const headerWithSort = [...header];
		const sortColumnIndex = this.currentView === "overall"
			? ["title", "size", "files", "library"].indexOf(this.currentSortColumn)
			: ["title", "size", "files"].indexOf(this.currentSortColumn);

		if (sortColumnIndex >= 0) {
			headerWithSort[sortColumnIndex] += sortIndicator;
		}

		const tableData = [headerWithSort];

		for (const item of pageItems) {
			const row = [
				this.truncateTitle(item.title),
				item.size,
				String(item.files),
			];

			if (this.currentView === "overall" && item.library) {
				row.push(this.truncateTitle(item.library, 15));
			}

			tableData.push(row);
		}

		this.itemsTable.setData(tableData);
		this.screen?.render();
	}

	private updateStatusLog(): void {
		if (!this.statusLog) return;

		const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
		const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
		const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

		const status = [
			`View: ${this.currentView === "overall" ? "All Libraries" : "Selected Library"}`,
			`Items: ${startItem}-${endItem} of ${this.totalItems}`,
			`Page: ${this.currentPage}/${maxPage}`,
			`Sort: ${this.currentSortColumn} (${this.sortDirection})`,
			"",
			"Controls:",
			"←/→ or A/D: Navigate pages | Home/End or W/S: First/Last page",
			"1-3: Sort by column | R: Reverse sort direction | Q: Quit",
		];

		this.statusLog.setContent(status.join("\n"));
		this.screen?.render();
	}

	private truncateTitle(title: string, maxLength: number = 30): string {
		if (title.length <= maxLength) return title;
		return `${title.slice(0, maxLength - 3)}...`;
	}

	private parseSize(sizeStr: string): number {
		// Simple parser for "123 MB" -> 123000000
		const match = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/);
		if (!match) return 0;

		const value = parseFloat(match[1]);
		const unit = match[2];

		const multipliers = {
			B: 1,
			KB: 1000,
			MB: 1000000,
			GB: 1000000000,
			TB: 1000000000000,
		};

		return value * (multipliers[unit as keyof typeof multipliers] || 1);
	}
}