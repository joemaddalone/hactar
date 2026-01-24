import type {
  SortColumn,
  SortDirection,
  ViewType,

} from "./types";

export const displayItemsConfig = (
  type: string,
): {
  currentView: ViewType;
  level: ViewType;
  currentShow?: string | undefined;
  currentSeason?: string | undefined;
  currentPage: number;
  selectedTableIndex: number;
  currentSortColumn: SortColumn;
  sortDirection: SortDirection;
} => {
  switch (type) {
    case "overall":
      return {
        currentView: "overall",
        level: "overall",
        currentShow: undefined,
        currentSeason: undefined,
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "size",
        sortDirection: "desc",
      };
    case "library":
      return {
        currentView: "library",
        level: "library",
        currentShow: undefined,
        currentSeason: undefined,
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "size",
        sortDirection: "desc",
      };

    case "show":
      return {
        currentView: "show",
        level: "show",
        currentShow: undefined,
        currentSeason: undefined,
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "index",
        sortDirection: "asc",
      };
    case "season":
      return {
        currentView: "season",
        level: "season",
        currentShow: undefined,
        currentSeason: undefined,
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "index",
        sortDirection: "asc",
      };
    default:
      return {
        currentView: "overall",
        level: "overall",
        currentShow: undefined,
        currentSeason: undefined,
        currentPage: 1,
        selectedTableIndex: 0,
        currentSortColumn: "size",
        sortDirection: "desc",
      };
  }
};
