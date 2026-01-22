# Tech Context: hactar

## Technologies Used

- **Runtime**: Node.js
- **Language**: TypeScript (compiled to CommonJS)
- **CLI Framework**: [Commander.js](https://www.npmjs.com/package/commander)
- **Interactive Prompts**: [Inquirer.js](https://www.npmjs.com/package/inquirer)
- **Terminal UI**: [Blessed](https://www.npmjs.com/package/blessed) for dashboard interface
- **Visual Indicators**: [Ora](https://www.npmjs.com/package/ora) for loading spinners
- **Custom Logger**: Centralized styling and formatting utility
- **Utility**: `@joemaddalone/filets` for file size operations

## Development Setup

- **Build Tool**: TypeScript Compiler (`tsc`)
- **Code Quality**: Biome for linting and formatting (`biome.json`)
- **Entry Point**: `src/index.ts`
- **Output Directory**: `dist/`
- **Package Management**: npm with lockfile
- **Scripts**: build, dev (watch), start, clean, lint, format, sync-ai

## Technical Constraints

- Requires accessible Plex Media Server via HTTP/HTTPS
- Requires valid Plex Authentication Token (`X-Plex-Token`)
- Dashboard requires TTY environment (terminal)
- API responses must be in JSON format
- Network connectivity to Plex server required
- Pagination limited to 20 items per page for performance

## Dependencies

### Production Dependencies
- `commander`: Command-line interface framework
- `inquirer`: Interactive CLI prompts
- `ora`: Terminal spinners and loading indicators
- `blessed`: Terminal User Interface framework with keyboard event handling
- `blessed-contrib`: Extended widgets for blessed (dashboard components)
- `@joemaddalone/filets`: File size utilities

### Development Dependencies
- `typescript`: TypeScript compiler and type definitions
- `@biomejs/biome`: Code formatting and linting
- `@types/node`: Node.js type definitions
- `@types/blessed`: Blessed library type definitions
