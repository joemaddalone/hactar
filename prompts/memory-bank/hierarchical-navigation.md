# Hierarchical Navigation Implementation

Enable drill-down from Shows → Seasons → Episodes with keyboard-based navigation.

## Key UX Changes

| Current                       | New                                        |
| ----------------------------- | ------------------------------------------ |
| Up/Down/Enter on library list | **Tab** cycles through libraries           |
| No table interaction          | **Up/Down** navigate table rows            |
| -                             | **Enter** drills into selected show/season |
| Esc returns to overall        | **Backspace** goes back one level          |

---

## Implementation Summary

### types.ts Changes

- Extend `ViewType` to: `"overall" | "library" | "show" | "season"`
- Add `sourceType` and `sourceKey` to `DashboardItem` for drill-down tracking
- Add `NavigationState` interface for breadcrumb tracking
- Add navigation callbacks: `onCycleLibrary`, `onDrillDown`, `onNavigateBack`, `onTableUp`, `onTableDown`

### keyboard.ts Changes

- **Tab**: Cycle libraries
- **Up/Down**: Navigate table rows
- **Enter**: Drill into show/season
- **Backspace**: Go back one level

### views.ts Changes

- Add `collectSeasonItems(show)` function
- Add `collectEpisodeItems(season)` function
- Update existing functions to populate `sourceType` and `sourceKey`

### layout.ts Changes

- Remove `keys: true, vi: true` from libraryList

### index.ts Changes

- Add `navigationState` tracking
- Add `selectedTableIndex` for table row tracking
- Add `displayShowItems()` and `displaySeasonItems()` methods
- Update `updateStatusLog()` for breadcrumb display

## Success Criteria

- Tab cycles between libraries
- Up/Down navigates table rows
- Enter on show displays seasons
- Enter on season displays episodes
- Backspace returns to previous level
- Breadcrumb shows current path
