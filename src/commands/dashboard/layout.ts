import * as blessed from "blessed";
import type { DashboardWidgets } from "./types";

/**
 * Creates the dashboard layout with all UI widgets
 */
export function createLayout(screen: blessed.Widgets.Screen): DashboardWidgets {
	// 1. Library List (left panel - 30% width)
	// Note: keys/vi disabled - library switching now uses Tab
	const libraryList = blessed.list({
		parent: screen,
		label: "Libraries [Tab]",
		top: 0,
		left: 0,
		width: "30%",
		height: "70%",
		keys: false,
		vi: false,
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
	const storageChart = blessed.box({
		parent: screen,
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
	// Note: keys/vi disabled - we handle Up/Down manually for drill-down
	const itemsTable = blessed.listtable({
		parent: screen,
		label: "Items [↑↓ Enter]",
		top: "30%",
		left: "30%",
		width: "70%",
		height: "40%",
		keys: false,
		vi: false,
		border: { type: "line" },
		align: "left",
		style: {
			focus: {
				border: {
					fg: 'red' // Red border when focused
				}
			},
			header: {
				fg: "cyan",
				bold: true,
			},
			cell: {
				selected: {
					fg: "black",
					bg: "green",
				}
			},
		},
	});

	// 4. Status Log (bottom - 100% width, 30% height)
	const statusLog = blessed.box({
		parent: screen,
		label: "Activity Log",
		top: "70%",
		left: 0,
		width: "100%",
		height: "30%",
		border: { type: "line" },
		scrollable: true,
		alwaysScroll: true,
	});

	return {
		screen,
		libraryList,
		storageChart,
		itemsTable,
		statusLog,
	};
}
