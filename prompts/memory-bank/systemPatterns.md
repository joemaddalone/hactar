# System Patterns: hactar

## Architecture Overview

Hactar is a production-ready TypeScript-based Node.js CLI application with a clean, modular structure:

- **CLI Entry Point (`src/index.ts`)**: Initializes the CLI with proper error handling and process management.
- **Command Registry (`src/commands/index.ts`)**: Manages registration and execution of all Commander.js commands.
- **Commands (`src/commands/*`)**: Complete command implementations including `configure`, `test`, `scan`, `dashboard`, and `help`.
- **Dashboard Modules (`src/commands/dashboard/*`)**: Modular dashboard with dedicated files for types, layout, keyboard controls, sorting, views, and storage chart rendering.
- **Plex Client (`src/client/plex.ts`)**: Full-featured communication with the Plex API including authentication and data retrieval.
- **Storage Client (`src/client/storage.ts`)**: Handles data aggregation and storage calculations.
- **Configuration Manager (`src/client/configure.ts`)**: Interactive configuration system with credential persistence.
- **Logger (`src/client/logger.ts`)**: Centralized styling and logging utility for consistent CLI output.
- **Type Definitions (`src/types/`)**: Comprehensive TypeScript interfaces for all data structures.

## Key Technical Decisions

- **Commander.js**: Provides robust CLI argument parsing and command structure.
- **Inquirer.js**: Enables interactive prompts for seamless configuration experience.
- **Ora**: Delivers smooth terminal spinners during long-running operations.
- **Blessed**: Powers the complete TUI dashboard with multi-panel layout and interactive controls.
- **CommonJS Output**: Targets CommonJS for maximum Node.js compatibility while using TypeScript/ESM in development.
- **TypeScript**: Ensures type safety throughout the application with comprehensive interfaces.

## Design Patterns

- **Registry Pattern**: Centralized command management through `CommandRegistry`.
- **Unified Data Structure**: `LibraryScanResult` serves as the standard exchange format between all components.
- **Modular Architecture**: Clear separation of concerns with dedicated modules for each responsibility. Dashboard follows this with isolated modules for layout, keyboard, sorting, views, and storage chart.
- **Centralized Configuration**: All dashboard view-specific logic (columns, headers, default sorting, dynamic visibility) is centralized in `display-items-config.ts`, making UI changes maintainable and consistent.
- **Async/Await**: Consistent asynchronous execution for all API calls and I/O operations.
- **Error Boundaries**: Comprehensive error handling at multiple levels with user-friendly messages.
- **Configuration Persistence**: Secure storage of user credentials with proper validation.
- **State Management**: Centralized pagination and sorting state for consistent user experience. Uses `cachedLibraryData` to persist library information for quick switching between library and overall views.
- **Interactive UI Pattern**: Event-driven keyboard controls with immediate visual feedback and hierarchical navigation support.
- **Command Pattern**: Each CLI command is implemented as a separate class extending `BaseCommand` for consistent error handling and configuration management.
