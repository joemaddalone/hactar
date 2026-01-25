import { Command } from "commander";
import * as blessed from "blessed";
import { BaseCommand } from "../base-command";
import { PlexClient } from "../../client/plex";
import { StorageClient } from "../../client/storage";
import type { LibraryScanResult, Show, Season } from "../../types";

import { createLayout } from "./layout";
import { setupKeyboardControls } from "./keyboard";
import { displayItemsConfig } from "./display-items-config";
import { sortItems } from "./sorting";
import { updateStorageChart } from "./storage-chart";
import { ModalManager } from "./modal";
import { DashboardModalIntegration } from "./dashboard-modal-integration";
import {
  collectOverallItems,
  collectLibraryItems,
  collectSeasonItems,
  collectEpisodeItems,
  truncateTitle,
} from "./views";
import type {
  CachedLibraryData,
  DashboardItem,
  DashboardWidgets,
  NavigationState,
  SortColumn,
  SortDirection,
  ViewType,
  KeyboardCallbacks,
  DashboardState,
} from "./types";

export class DashboardCommand extends BaseCommand {
  private screen: blessed.Widgets.Screen | null = null;
  private widgets: DashboardWidgets | null = null;

  // Modal management
  private modalManager: ModalManager = new ModalManager();
  private modalIntegration: DashboardModalIntegration | null = null;
  private activeModal: string | null = null;

  // Pagination and sorting state
  private currentPage: number = 1;
  private itemsPerPage: number = 20;
  private totalItems: number = 0;
  private currentSortColumn: SortColumn = "size";
  private sortDirection: SortDirection = "desc";
  private selectedLibrary: string | null = null;
  private currentItems: DashboardItem[] = [];
  private currentView: ViewType = "overall";
  private libraryType: string | undefined;
  private cachedLibraryData: CachedLibraryData[] = [];

  // Navigation state for hierarchical drill-down
  private navigationState: NavigationState = {
    level: "overall",
    libraryIndex: 0,
  };
  private selectedTableIndex: number = 0;

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

      // Initialize modal integration
      this.initializeModalIntegration();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logError(`Failed to initialize terminal UI: ${errorMsg}`);
      throw error;
    }
  }

  private initializeModalIntegration(): void {
    const initialDashboardState: DashboardState = {
      currentPage: this.currentPage,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      currentView: this.currentView,
      currentSortColumn: this.currentSortColumn,
      sortDirection: this.sortDirection,
      selectedTableIndex: this.selectedTableIndex,
      navigationState: this.navigationState,
      libraryType: this.libraryType,
      activeModal: this.activeModal,
    };

    this.modalIntegration = new DashboardModalIntegration(initialDashboardState);
    
    // Initialize modal manager (will be used in future phases)
    if (this.modalManager && this.modalIntegration) {
      // Modal infrastructure ready
    }
  }

  private createKeyboardCallbacks(): KeyboardCallbacks {
    return {
      onPreviousPage: () => {
        this.currentPage--;
        this.selectedTableIndex = (this.currentPage - 1) * this.itemsPerPage;
        this.refreshItemsTable();
        this.updateStatusLog();
      },
      onNextPage: () => {
        this.currentPage++;
        this.selectedTableIndex = (this.currentPage - 1) * this.itemsPerPage;
        this.refreshItemsTable();
        this.updateStatusLog();
      },
      onFirstPage: () => {
        this.currentPage = 1;
        this.selectedTableIndex = 0;
        this.refreshItemsTable();
        this.updateStatusLog();
      },
      onLastPage: () => {
        this.currentPage = Math.ceil(this.totalItems / this.itemsPerPage);
        this.selectedTableIndex = (this.currentPage - 1) * this.itemsPerPage;
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
        this.navigationState = { level: "overall", libraryIndex: 0 };
        if (this.widgets?.libraryList) {
          this.widgets.libraryList.select(0);
        }
        this.displayItems("overall", this.cachedLibraryData);
      },
      // New navigation callbacks
      onCycleLibrary: () => {
        this.cycleLibrary();
      },
      onDrillDown: () => {
        this.drillDown();
      },
      onNavigateBack: () => {
        this.navigateBack();
      },
      onTableUp: () => {
        this.moveTableSelection(-1);
      },
      onTableDown: () => {
        this.moveTableSelection(1);
      },
      // Modal controls
      onOpenConfigureModal: () => {
        this.openConfigureModal();
        if (this.screen) {
          this.modalManager.createModal(this.screen, 'configure');
          this.modalManager.showModal('configure');
        }
      },
      onOpenScanModal: () => {
        this.openScanModal();
        if (this.screen) {
          this.modalManager.createModal(this.screen, 'scan');
          this.modalManager.showModal('scan');
        }
      },
      onCloseModal: () => {
        this.closeModal();
        this.modalManager.hideModal();
      },
      getState: () => ({
        currentPage: this.currentPage,
        totalItems: this.totalItems,
        itemsPerPage: this.itemsPerPage,
        currentView: this.currentView,
        currentSortColumn: this.currentSortColumn,
        sortDirection: this.sortDirection,
        selectedTableIndex: this.selectedTableIndex,
        navigationState: this.navigationState,
        libraryType: this.libraryType,
        activeModal: this.activeModal,
      }),
    };
  }

  private cycleLibrary(): void {
    const totalLibraries = this.cachedLibraryData.length + 1; // +1 for "All Libraries"
    this.navigationState.libraryIndex =
      (this.navigationState.libraryIndex + 1) % totalLibraries;

    if (this.widgets?.libraryList) {
      this.widgets.libraryList.select(this.navigationState.libraryIndex);
    }

    // Reset navigation state when switching libraries
    this.navigationState.currentShow = undefined;
    this.navigationState.currentSeason = undefined;

    if (this.navigationState.libraryIndex === 0) {
      this.displayItems("overall", this.cachedLibraryData);
    } else {
      const selectedLib =
        this.cachedLibraryData[this.navigationState.libraryIndex - 1];
      if (selectedLib?.data) {
        this.displayItems("library", selectedLib.data);
      }
    }
  }

  private drillDown(): void {
    if (this.currentItems.length === 0) return;

    const selectedItem = this.currentItems[this.selectedTableIndex];
    if (!selectedItem) return;

    // Only shows and seasons can be drilled into
    if (selectedItem.sourceType === "show") {
      const show = this.findShowByKey(selectedItem.sourceKey);
      if (show) {
        this.displayItems("show", show);
      }
    } else if (selectedItem.sourceType === "season") {
      const season = this.findSeasonByKey(selectedItem.sourceKey);
      if (season) {
        this.displayItems("season", season);
      }
    }
    // Movies and episodes are leaf nodes - no drill-down
  }

  private navigateBack(): void {
    switch (this.currentView) {
      case "season":
        // Go back to show view
        if (this.navigationState.currentShow) {
          this.displayItems("show", this.navigationState.currentShow);
        }
        break;
      case "show":
        // Go back to library view
        if (this.navigationState.libraryIndex === 0) {
          this.currentSortColumn = "size";
          this.sortDirection = "desc";
          this.displayItems("overall", this.cachedLibraryData);
        } else {
          const lib =
            this.cachedLibraryData[this.navigationState.libraryIndex - 1];
          if (lib?.data) {
            this.currentSortColumn = "size";
            this.sortDirection = "desc";
            this.displayItems("library", lib.data);
          }
        }
        break;
      case "library":
        // Go back to overall view
        this.navigationState.libraryIndex = 0;
        if (this.widgets?.libraryList) {
          this.widgets.libraryList.select(0);
        }
        this.currentSortColumn = "size";
        this.sortDirection = "desc";
        this.displayItems("overall", this.cachedLibraryData);
        break;
      // "overall" is the root - can't go back further
    }
  }

  private moveTableSelection(delta: number): void {
    const pageStart = (this.currentPage - 1) * this.itemsPerPage;
    const pageEnd = Math.min(pageStart + this.itemsPerPage, this.totalItems);
    const pageItemCount = pageEnd - pageStart;

    if (pageItemCount === 0) return;

    // Calculate new index within current page bounds
    const currentPageIndex = this.selectedTableIndex - pageStart;
    const newPageIndex = currentPageIndex + delta;

    // Handle page boundaries
    if (newPageIndex < 0) {
      // Move to previous page if possible
      if (this.currentPage > 1) {
        this.currentPage--;
        this.selectedTableIndex = this.currentPage * this.itemsPerPage - 1;
      } else {
        this.selectedTableIndex = pageStart; // Stay at first item
      }
    } else if (newPageIndex >= pageItemCount) {
      // Move to next page if possible
      const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.selectedTableIndex = (this.currentPage - 1) * this.itemsPerPage;
      } else {
        this.selectedTableIndex = pageEnd - 1; // Stay at last item
      }
    } else {
      this.selectedTableIndex = pageStart + newPageIndex;
    }

    this.refreshItemsTable();
    this.updateStatusLog();
  }

  private findShowByKey(key?: string): Show | undefined {
    if (!key) return undefined;

    for (const lib of this.cachedLibraryData) {
      if (lib.data?.data) {
        for (const item of lib.data.data) {
          if (item.ratingKey === key && "seasons" in item) {
            return item as Show;
          }
        }
      }
    }
    return undefined;
  }

  private findSeasonByKey(key?: string): Season | undefined {
    if (!key || !this.navigationState.currentShow) return undefined;

    return this.navigationState.currentShow.seasons?.find(
      (s) => s.ratingKey === key,
    );
  }

  private sortByColumn(column: SortColumn): void {
    if (column === "library" && this.currentView !== "overall") return;
    this.currentSortColumn = column;
    this.currentPage = 1;
    this.selectedTableIndex = 0;

    // Sort items using the modular sorting function
    this.currentItems = sortItems(
      this.currentItems,
      column,
      this.sortDirection,
    );

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
      updateStorageChart(
        storageChart,
        totalSize,
        totalFiles,
        this.cachedLibraryData,
      );

      // Show overall view initially
      this.displayItems("overall", this.cachedLibraryData);
      this.updateStatusLog();
    } catch (error) {
      statusLog.setContent(
        `Error loading data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private displayItems(
    type: ViewType,
    libraryData: CachedLibraryData[] | Show | LibraryScanResult | Season,
  ) {
    if (!this.widgets?.itemsTable) return;
    type = type || "overall";

    switch (type) {
      case "overall": {
        this.currentItems = collectOverallItems(
          libraryData as CachedLibraryData[],
        );
        this.libraryType = undefined;
        break;
      }
      case "library": {
        const d = libraryData as LibraryScanResult;
        this.navigationState.currentShow = undefined;
        this.navigationState.currentSeason = undefined;
        this.currentItems = collectLibraryItems(d);
        this.selectedLibrary = d.libraryName;
        this.libraryType = d.libraryType;
        break;
      }
      case "show": {
        const show = libraryData as Show;
        this.navigationState.currentShow = show;
        this.navigationState.currentSeason = undefined;
        this.currentItems = collectSeasonItems(show);
        // keep libraryType from parent
        break;
      }
      case "season": {
        const season = libraryData as Season;
        this.navigationState.currentSeason = season;
        this.currentItems = collectEpisodeItems(season);
        // keep libraryType from parent
        break;
      }
    }

    const config = displayItemsConfig(type, this.libraryType);
    this.currentView = config.currentView;
    this.navigationState.level = config.level;
    this.currentPage = config.currentPage;
    this.currentSortColumn = config.currentSortColumn;
    this.sortDirection = config.sortDirection;
    this.selectedTableIndex = config.selectedTableIndex;

    this.totalItems = this.currentItems.length;
    if (this.currentItems.length === 0) {
      this.refreshItemsTable();
      this.updateStatusLog();
      return;
    }
    this.sortByColumn(this.currentSortColumn);
  }

  private refreshItemsTable(): void {
    if (!this.widgets?.itemsTable) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageItems = this.currentItems.slice(startIndex, endIndex);

    const config = displayItemsConfig(this.currentView, this.libraryType);
    const { columns } = config.viewConfig;

    // Prepare table data with header
    const header = columns.map((col) => col.header);

    // Add sort indicators to header
    const sortIndicator = this.sortDirection === "asc" ? " ↑" : " ↓";
    const headerWithSort = [...header];

    const sortColumnIndex = columns.findIndex(
      (col) => col.key === this.currentSortColumn,
    );

    if (sortColumnIndex >= 0) {
      headerWithSort[sortColumnIndex] += sortIndicator;
    }

    const tableData = [headerWithSort];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      const isSelected = startIndex + i === this.selectedTableIndex;
      const prefix = isSelected ? "→ " : "  ";

      const row: string[] = [];

      for (const col of columns) {
        let value = "";
        switch (col.key) {
          case "index":
            value = String(item.index || 0);
            break;
          case "title":
            value = prefix + truncateTitle(item.title, 28);
            break;
          case "size":
            value = item.size;
            break;
          case "episodes":
            value = String(item.episodes);
            break;
          case "library":
            value = truncateTitle(item.library || "", 15);
            break;
        }
        row.push(value);
      }

      tableData.push(row);
    }

    this.widgets.itemsTable.setData(tableData);

    // Update table label based on current view
    this.widgets.itemsTable.setLabel(this.getTableLabel());
    // Set focus to the selected row (relative to current page + header)
    const relativeIndex = this.selectedTableIndex - startIndex + 1;
    this.widgets.itemsTable.select(relativeIndex);

    this.screen?.render();
  }

  private getTableLabel(): string {
    switch (this.currentView) {
      case "overall":
        return "All Items [↑↓ Enter]";
      case "library":
        return `${this.selectedLibrary || "Library"} [↑↓ Enter]`;
      case "show":
        return `${this.navigationState.currentShow?.title || "Show"} - Seasons [↑↓ Enter]`;
      case "season":
        return `${this.navigationState.currentSeason?.title || "Season"} - Episodes`;
    }
  }

  private getBreadcrumb(): string {
    const parts: string[] = [];

    if (this.currentView === "overall") {
      parts.push("All Libraries");
    } else {
      if (this.navigationState.libraryIndex > 0) {
        parts.push(
          this.cachedLibraryData[this.navigationState.libraryIndex - 1]
            ?.title || "Library",
        );
      }

      if (this.navigationState.currentShow) {
        parts.push(this.navigationState.currentShow.title);
      }

      if (this.navigationState.currentSeason) {
        parts.push(this.navigationState.currentSeason.title);
      }
    }

    return parts.join(" > ");
  }

  private updateStatusLog(): void {
    if (!this.widgets?.statusLog) return;

    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage) || 1;
    const startItem =
      this.totalItems > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
    const endItem = Math.min(
      this.currentPage * this.itemsPerPage,
      this.totalItems,
    );

    const selectedItem = this.currentItems[this.selectedTableIndex];
    const canDrillDown =
      selectedItem?.sourceType === "show" ||
      selectedItem?.sourceType === "season";

    const status = [
      `Path: ${this.getBreadcrumb()}`,
      `Items: ${startItem}-${endItem} of ${this.totalItems} | Selected: ${this.selectedTableIndex + 1}`,
      `Page: ${this.currentPage}/${maxPage} | Sort: ${this.currentSortColumn} (${this.sortDirection})`,
      "",
      "Navigation:",
      "Tab: Switch library | ↑↓: Select item | Enter: Drill down | Backspace: Go back",
      "←/→: Page | 1-4: Sort | R: Reverse | 0: Overall | Q: Quit",
      canDrillDown
        ? `[${selectedItem.sourceType === "show" ? "→ Enter to view seasons" : "→ Enter to view episodes"}]`
        : "",
    ];

    this.widgets.statusLog.setContent(status.join("\n"));
    this.screen?.render();
  }

  // Modal state management methods
  public getActiveModal(): string | null {
    return this.activeModal;
  }

  public openConfigureModal(): void {
    this.activeModal = "configure";
  }

  public openScanModal(): void {
    this.activeModal = "scan";
  }

  public closeModal(): void {
    this.activeModal = null;
  }
}
