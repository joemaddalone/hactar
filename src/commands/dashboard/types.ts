import type * as blessed from "blessed";
import type { LibraryScanResult, Show, Season } from "../../types";

/**
 * Source type for drill-down navigation
 */
export type SourceType = "show" | "season" | "episode" | "movie";

/**
 * Represents an item displayed in the dashboard table
 */
export interface DashboardItem {
	title: string;
	size: string;
	files: number;
	library?: string;
	bytes?: number;
	// Source reference for drill-down navigation
	sourceType?: SourceType;
	sourceKey?: string; // ratingKey to find original data
}

/**
 * Cached library data structure
 */
export interface CachedLibraryData {
	key: string;
	title: string;
	data: LibraryScanResult | null;
}

/**
 * Current view type in the dashboard
 */
export type ViewType = "overall" | "library" | "show" | "season";

/**
 * Sort direction for table columns
 */
export type SortDirection = "asc" | "desc";

/**
 * Sortable column names
 */
export type SortColumn = "title" | "size" | "files" | "library";

/**
 * Dashboard widget references
 */
export interface DashboardWidgets {
	screen: blessed.Widgets.Screen;
	libraryList: blessed.Widgets.ListElement;
	storageChart: blessed.Widgets.BoxElement;
	itemsTable: blessed.Widgets.ListTableElement;
	statusLog: blessed.Widgets.BoxElement;
}

/**
 * Navigation state for hierarchical drill-down
 */
export interface NavigationState {
	level: ViewType;
	libraryIndex: number;
	currentShow?: Show | undefined;
	currentSeason?: Season | undefined;
}

/**
 * Dashboard state for keyboard control callbacks
 */
export interface DashboardState {
	currentPage: number;
	totalItems: number;
	itemsPerPage: number;
	currentView: ViewType;
	currentSortColumn: SortColumn;
	sortDirection: SortDirection;
	selectedTableIndex: number;
	navigationState: NavigationState;
}

/**
 * Callbacks for keyboard controls
 */
export interface KeyboardCallbacks {
	onPreviousPage: () => void;
	onNextPage: () => void;
	onFirstPage: () => void;
	onLastPage: () => void;
	onSortByColumn: (column: SortColumn) => void;
	onToggleSortDirection: () => void;
	onReturnToOverall: () => void;
	// Navigation controls
	onCycleLibrary: () => void;
	onDrillDown: () => void;
	onNavigateBack: () => void;
	onTableUp: () => void;
	onTableDown: () => void;
	getState: () => DashboardState;
}
