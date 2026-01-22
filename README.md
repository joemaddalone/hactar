<h1 align="center" id="title">hactat</h1>
<div align="center">

![HACTAR](https://img.shields.io/badge/HACTAR-Plex%20Management-blue?style=for-the-badge)
[![Buy Me A Coffee](https://img.shields.io/badge/Support-Buy%20Me%20A%20Coffee-orange?style=for-the-badge)](https://buymeacoffee.com/joemaddalone)

</div>

# Hactar

Hactar is a lightweight Node.js CLI for gathering and visualising storage information from Plex Media Server libraries. It lets you quickly see which shows, seasons, movies or entire libraries consume the most disk space, so you can clean up or archive files with confidence.

## 🔧 Prerequisites

- Node ≥ 18
- A running Plex Media Server with a valid token.
  - [How to find your token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/joemaddalone/hactar.git
cd hactar

# 2. Install dependencies
npm install

# 3. Build the TypeScript sources
npm run build
```

After building, the compiled JavaScript lives in `dist/`. You can run the CLI directly using Node:

```bash
node dist/index.js <command>
```

Or, if you have `npx` available, you can execute the binary without the `node` prefix:

```bash
npx hactar <command>
```

> **Tip** – If you want to use Hactar as a global command, run
> `npm install -g .` from the root of the repo after building.

## 📌 Core Commands

| Command     | Description                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `configure` | Prompts for Plex Server URL and token, then stores them in `~/.hactar/config.json`.                                          |
| `scan`      | Scans all known libraries, caches results locally, and displays a selectable list.                                           |
| `dashboard` | Opens an interactive TUI dashboard showing storage statistics, library breakdowns and an item‑by‑item table. Requires a TTY. |
| `test`      | Tests connectivity to the Plex server using stored credentials.                                                              |
| `help`      | Displays help information for available commands.                                                                            |

> The dashboard uses the blessed library and will not render in non‑interactive terminals.

## 🔒 Configuration

Run `hactar configure` before performing scans. The tool will prompt for:

- **Plex Server URL** – e.g. `http://localhost:32400` or the address of your remote server.
- **Plex Token** – a long‑string token that authorizes API access.

The configuration is persisted in `~/.hactar/config.json`. If the file is missing or incomplete, `hactar` will prompt you again.

## 📚 Example Workflow

```bash
# Configure first
npx hactar configure

# Scan all libraries (you’ll pick one when prompted)
npx hactar scan

# Launch the dashboard for interactive exploration
npx hactar dashboard
```

**Happy cleaning!**
