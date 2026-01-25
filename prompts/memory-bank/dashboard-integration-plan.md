# Dashboard Integration Plan: Scan & Configure

## Overview

Add scan and configure functionality directly into the dashboard TUI as an **alternative access method**. Users will have two ways to access the same functionality:

- **CLI Commands**: `hactar configure` and `hactar scan` (existing inquirer.js interface - unchanged)
- **TUI Modals**: Press `c` or `s` in dashboard (new blessed interface)

Both access methods will share the same underlying logic, ensuring consistent behavior and maintaining backward compatibility.

## Current State Analysis

### Existing Components
- **Dashboard**: Multi-panel TUI with library list, storage chart, items table, and status log
- **ConfigureCommand**: Uses inquirer.js for interactive prompts (server URL, token) - **KEEP UNCHANGED**
- **ScanCommand**: Uses inquirer.js for library selection, then scans and caches results - **KEEP UNCHANGED**
- **Keyboard System**: Tab-based navigation, drill-down controls, sorting

### Key Challenge
Create blessed TUI modals that provide the same functionality as the CLI commands, while sharing the underlying business logic.

## Implementation Plan

### Phase 1: Extract Shared Logic

#### 1.1 Refactor ConfigureCommand
- **File**: `src/commands/configure.ts` (modify existing)
- **Extract**: Core configuration logic into reusable methods
- **New Methods**:
  - `async performConfiguration(serverUrl: string, token: string): Promise<boolean>`
  - `async testConnection(): Promise<boolean>`
- **Keep**: Existing `execute()` method unchanged for CLI usage

#### 1.2 Refactor ScanCommand  
- **File**: `src/commands/scan.ts` (modify existing)
- **Extract**: Core scanning logic into reusable methods
- **New Methods**:
  - `async getAvailableLibraries(): Promise<PlexLibraryResponse[]>`
  - `async performScan(libraryKey: string): Promise<LibraryScanResult>`
- **Keep**: Existing `execute()` method unchanged for CLI usage

### Phase 2: Modal System Foundation

#### 2.1 Create Modal Infrastructure
- **File**: `src/commands/dashboard/modal.ts`
- **Purpose**: Base modal system for overlaying forms on the dashboard
- **Components**:
  - `createModal()` - Creates overlay box with backdrop
  - `showModal()` / `hideModal()` - Modal visibility management
  - `focusModal()` - Focus management between dashboard and modal

#### 2.2 Modal Types Interface
- **File**: `src/commands/dashboard/types.ts` (extend existing)
- **Add**:
  ```typescript
  export type ModalType = "configure" | "scan" | "none";
  export interface ModalState {
    type: ModalType;
    visible: boolean;
    data?: any;
  }
  ```

### Phase 3: Configuration Modal

#### 3.1 Configuration Form Widget
- **File**: `src/commands/dashboard/configure-modal.ts`
- **Components**:
  - Server URL input field (blessed.textbox)
  - Token input field (blessed.textbox with `secret: true`)
  - Save/Cancel buttons (blessed.button)
  - Validation feedback display
  - Connection test integration

#### 3.2 Integration with ConfigureCommand
- **Import**: `ConfigureCommand` class
- **Call**: `configureCommand.performConfiguration(serverUrl, token)`
- **Reuse**: All existing validation and persistence logic
- **UI**: blessed widgets replace inquirer.js prompts

### Phase 4: Scan Modal

#### 4.1 Library Selection Widget
- **File**: `src/commands/dashboard/scan-modal.ts`
- **Components**:
  - Library list (blessed.list) - similar to existing dashboard library list
  - Scan progress indicator (blessed.progressbar or custom spinner)
  - Cancel button
  - Status messages

#### 4.2 Integration with ScanCommand
- **Import**: `ScanCommand` class  
- **Call**: `scanCommand.getAvailableLibraries()` and `scanCommand.performScan(libraryKey)`
- **Reuse**: All existing scan and caching logic
- **UI**: blessed widgets replace inquirer.js prompts

### Phase 5: Dashboard Integration

#### 5.1 Keyboard Controls Extension
- **File**: `src/commands/dashboard/keyboard.ts` (extend existing)
- **New Keys**:
  - `c` - Open configure modal
  - `s` - Open scan modal  
  - `Escape` - Close active modal
  - `Enter` - Submit active form
  - `Tab` - Navigate between form fields (when modal active)

#### 5.2 Dashboard State Management
- **File**: `src/commands/dashboard/index.ts` (extend existing)
- **Add**:
  - Modal state tracking
  - Focus management between dashboard and modals
  - Modal-specific keyboard event routing
  - Auto-refresh after configuration/scan changes

### Phase 6: UI/UX Enhancements

#### 6.1 Visual Improvements
- Modal backdrop (semi-transparent overlay)
- Form field highlighting and focus indicators
- Progress animations for long operations
- Success/error message styling

#### 6.2 Help System Integration
- Update status log to show modal-specific help
- Context-sensitive keyboard shortcuts display
- Inline validation messages

## Technical Implementation Details

### Modal Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard (dimmed/disabled)                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Modal Backdrop                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ Configure/Scan Form                         │    │    │
│  │  │  [Input Fields]                             │    │    │
│  │  │  [Buttons]                                  │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Blessed Widget Selection
- **Form Container**: `blessed.form` - Built-in form management
- **Text Inputs**: `blessed.textbox` - With validation support
- **Password Input**: `blessed.textbox` with `secret: true`
- **Buttons**: `blessed.button` - For submit/cancel actions
- **Progress**: `blessed.progressbar` - For scan progress
- **Lists**: `blessed.list` - For library selection

### State Flow
1. User presses `c` or `s` in dashboard
2. Modal state updated, keyboard routing changes
3. Modal rendered over dashboard (dashboard dimmed)
4. Form interaction handled by modal-specific logic
5. On completion: modal hidden, dashboard refreshed, focus restored

## Integration Points

### Existing Code Reuse
- **ConfigureCommand & ScanCommand**: Extract core methods, keep CLI interface intact
- **ConfigManager**: Direct reuse for credential persistence  
- **PlexClient**: Direct reuse for connection testing and library scanning
- **StorageClient**: Direct reuse for scan result caching
- **Validation Logic**: Shared between CLI and TUI interfaces

### Dual Access Architecture
```
┌─────────────────┐    ┌──────────────────────┐
│ CLI Commands    │    │ TUI Modals          │
│ - hactar config │    │ - Press 'c' key     │
│ - hactar scan   │    │ - Press 's' key     │
└─────────────────┘    └──────────────────────┘
         │                        │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │ Shared Logic    │
         │ - Configuration │
         │ - Scanning      │
         │ - Validation    │
         └─────────────────┘
```

### Dashboard Updates Required
- Add modal state to main dashboard state
- Extend keyboard handler with modal routing
- Add modal rendering to main render loop
- Update status log for modal help text

## Benefits

1. **Dual Access**: Users can choose CLI commands OR TUI modals based on preference
2. **Backward Compatibility**: Existing CLI workflows remain unchanged
3. **Unified Experience**: TUI users don't need to exit dashboard for configuration/scanning
4. **Code Reuse**: Shared logic ensures consistent behavior between interfaces
5. **Better UX**: Visual feedback and progress indicators in TUI
6. **Discoverability**: Help text shows available actions in both interfaces

## Risk Mitigation

- **Complexity**: Modular approach with separate files for each modal
- **Focus Management**: Clear focus indicators and escape routes
- **Error Handling**: Comprehensive error states with recovery options
- **Testing**: Incremental implementation allows testing at each phase

## Success Criteria

- [ ] CLI commands `hactar configure` and `hactar scan` remain fully functional
- [ ] TUI modals (`c` and `s` keys) provide equivalent functionality
- [ ] Shared logic ensures identical behavior between CLI and TUI
- [ ] No code duplication - core logic extracted and reused
- [ ] Visual feedback in TUI matches or exceeds CLI experience
- [ ] No regression in existing dashboard functionality
- [ ] Help system updated to show both access methods
