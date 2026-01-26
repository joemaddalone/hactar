<h1 align="center" id="title">hactar</h1>
<div align="center">

![HACTAR](https://img.shields.io/badge/HACTAR-Plex%20Management-blue?style=for-the-badge)
[![Buy Me A Coffee](https://img.shields.io/badge/Support-Buy%20Me%20A%20Coffee-orange?style=for-the-badge)](https://buymeacoffee.com/joemaddalone)

</div>

Hactar is a lightweight Node.js CLI for gathering and visualising storage information from Plex Media Server libraries. It lets you quickly see which shows, seasons, movies or entire libraries consume the most disk space, so you can clean up or archive files with confidence.

<img width="1240" height="1010" alt="Image" src="https://github.com/user-attachments/assets/21d7e713-e7a1-4a24-8da0-7e0e41ddb146" />
<img width="1239" height="1010" alt="Image" src="https://github.com/user-attachments/assets/3b3762e9-73e5-43b7-bab2-411b76f2881e" />
<img width="1236" height="1006" alt="Image" src="https://github.com/user-attachments/assets/451b2fa8-fe30-4e1f-b194-1a57a7436bc5" />

## 🔧 Prerequisites

- Node ≥ 18
- A running Plex Media Server with a valid token.
  - [How to find your token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

## 🚀 Getting Started

Install Hactar globally using npm:

```bash
npm install -g hactar-cli
```

That's it! You can now use the `hactar` command from anywhere in your terminal.

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
hactar configure

# Scan all libraries (you’ll pick one when prompted)
hactar scan

# Launch the dashboard for interactive exploration
hactar dashboard
```

**Happy cleaning!**

## 🤝 Contributing

Want to contribute to Hactar? Here's how to set up a development environment:

```bash
# 1. Clone the repository
git clone https://github.com/joemaddalone/hactar.git
cd hactar

# 2. Install dependencies
npm install

# 3. Build the TypeScript sources
npm run build

# 4. Run commands during development
node dist/index.js <command>

# Or start development mode (auto-rebuild on changes)
npm run dev
```

### Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run start` - Run the compiled CLI
- `npm run lint` - Check code style
- `npm run format` - Format code with Biome

### Project Structure

- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript output
- `src/commands/` - CLI command implementations
- `src/client/` - Plex API client and utilities
- `src/types/` - TypeScript type definitions
