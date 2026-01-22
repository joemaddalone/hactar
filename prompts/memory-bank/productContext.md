# Product Context: hactar

## Why this project exists

Plex users often have large media libraries that consume significant disk space. While the Plex Web UI provides metadata, it doesn't always make it easy to see exactly how much space specific shows, seasons, or libraries are consuming, or to identify where storage is being "wasted" (e.g., duplicate files or unexpectedly large encodes). Hactar ("Heroic hard drive savior") bridges this gap by providing a storage-focused view of a Plex server.

## Problems it solves

- **Storage Transparency**: Easily see which libraries or series are the largest.
- **Data Gathering**: Automates the extraction of file size information from the Plex API.
- **CLI Accessibility**: Provides a fast, terminal-based way to check server status without opening a browser.

## How it works

- **Authentication**: Uses a Plex Token and Server URL for API access.
- **Scanning**: Recursively traverses Plex libraries to aggregate media part sizes.
- **Reporting**: Displays human-readable size labels (KB, MB, GB, TB) and item counts.

## User Experience Goals

- **Simplicity**: Easy to configure and run.
- **Speed**: Efficiently scan libraries and provide results.
- **Clarity**: High-quality CLI output with clear progress indicators (using `ora` and `logger`).
