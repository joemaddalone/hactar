import type {
  SortColumn,
  SortDirection,
  ViewType,
  ViewConfig,
  ColumnConfig,
} from "./types";

export interface DisplayConfigResult {
  currentView: ViewType;
  level: ViewType;
  currentPage: number;
  selectedTableIndex: number;
  currentSortColumn: SortColumn;
  sortDirection: SortDirection;
  viewConfig: ViewConfig;
}

const getColumns = (view: ViewType, libraryType?: string): ColumnConfig[] => {
  const isMovieLibrary = libraryType === "movie";

  switch (view) {
    case "overall":
      return [
        { key: "title", header: "Title" },
        { key: "size", header: "Size" },
        { key: "episodes", header: "Episodes" },
        { key: "library", header: "Library" },
      ];
    case "library": {
      const cols: ColumnConfig[] = [
        { key: "title", header: "Title" },
        { key: "size", header: "Size" },
      ];
      if (!isMovieLibrary) {
        cols.push({ key: "episodes", header: "Episodes" });
      }
      return cols;
    }
    case "show":
      return [
        { key: "index", header: "Season" },
        { key: "title", header: "Title" },
        { key: "size", header: "Size" },
        { key: "episodes", header: "Episodes" },
      ];
    case "season":
      return [
        { key: "index", header: "Episode" },
        { key: "title", header: "Title" },
        { key: "size", header: "Size" },
      ];
    default:
      return [];
  }
};

export const displayItemsConfig = (
  type: ViewType,
  libraryType?: string,
): DisplayConfigResult => {
  const columns = getColumns(type, libraryType);

  switch (type) {
    case "overall":
      return {
        currentView: "overall",
        level: "overall",
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "size",
        sortDirection: "desc",
        viewConfig: {
          columns,
          defaultSortColumn: "size",
          defaultSortDirection: "desc",
        },
      };
    case "library":
      return {
        currentView: "library",
        level: "library",
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "size",
        sortDirection: "desc",
        viewConfig: {
          columns,
          defaultSortColumn: "size",
          defaultSortDirection: "desc",
        },
      };
    case "show":
      return {
        currentView: "show",
        level: "show",
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "index",
        sortDirection: "asc",
        viewConfig: {
          columns,
          defaultSortColumn: "index",
          defaultSortDirection: "asc",
        },
      };
    case "season":
      return {
        currentView: "season",
        level: "season",
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "index",
        sortDirection: "asc",
        viewConfig: {
          columns,
          defaultSortColumn: "index",
          defaultSortDirection: "asc",
        },
      };
    default:
      return displayItemsConfig("overall");
  }
};
