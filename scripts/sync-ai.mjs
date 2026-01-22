#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const platforms = [
	{
		id: "windsurf",
		name: "Windsurf",
		dirPath: ".windsurf/rules",
		useSourceFilename: true,
		selected: false,
	},
	{
		id: "agent",
		name: "Anti Gravity",
		dirPath: ".agent/rules",
		useSourceFilename: true,
		selected: true,
	},
	{
		id: "claude",
		name: "Claude Code",
		targetPath: "CLAUDE.MD",
		dirPath: "",
		useSourceFilename: false,
		selected: true,
	},
	{
		id: "cline",
		name: "Cline",
		dirPath: ".clinerules",
		useSourceFilename: true,
		selected: false,
	},
	{
		id: "cursor",
		name: "Cursor",
		dirPath: ".cursor/rules",
		useSourceFilename: true,
		selected: true,
	},
	{
		id: "codex",
		name: "ChatGPT Codex",
		targetPath: "AGENTS.md",
		dirPath: "",
		useSourceFilename: false,
		selected: false,
	},
	{
		id: "agentforce",
		name: "Agentforce Vibes",
		dirPath: ".a4drules",
		useSourceFilename: true,
		selected: false,
	},
	{
		id: "continue",
		name: "Continue",
		dirPath: ".continue",
		useSourceFilename: true,
		selected: false,
	},
	{
		id: "aider",
		name: "Aider",
		dirPath: ".aider",
		useSourceFilename: true,
		selected: false,
	},
	{
		id: "opencode",
		name: "OpenCode",
		targetPath: "AGENTS.MD",
		dirPath: "",
		useSourceFilename: false,
		selected: true,
	},
];

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.resolve(__dirname, "..");

function showResults(results) {
	console.log(`\n=== Results ===\n`);
	results.forEach((result) => {
		console.log(`  ${result}`);
	});
	console.log("");
}

async function syncFiles() {
	const sourceFullPath = path.join(rootPath, "prompts/instructions.md");

	if (!fs.existsSync(sourceFullPath)) {
		console.error(`[ERROR] Source file not found: prompts/instructions.md`);
		process.exit(1);
	}

	const selectedPlatforms = platforms.filter((p) => p.selected);

	if (selectedPlatforms.length === 0) {
		console.log(`[!] No platforms selected. Exiting.`);
		return;
	}

	const results = [];
	let successCount = 0;

	for (const platform of selectedPlatforms) {
		try {
			// Determine target path based on platform configuration
			// Some platforms use a fixed filename (e.g., CLAUDE.MD)
			// Others use the source filename in a directory (e.g., .windsurf/rules/<source>)
			const targetPath = platform.useSourceFilename
				? path.join(platform.dirPath, path.basename(sourceFullPath))
				: platform.targetPath;
			const targetFullPath = path.join(rootPath, targetPath);

			// Delete existing target file if present
			// This breaks the old hard link (if any) before creating a new one
			if (fs.existsSync(targetFullPath)) {
				fs.unlinkSync(targetFullPath);
			}

			// Create target directory if needed (e.g., .windsurf/rules/)
			if (platform.dirPath) {
				const dirFullPath = path.join(rootPath, platform.dirPath);
				if (!fs.existsSync(dirFullPath)) {
					fs.mkdirSync(dirFullPath, { recursive: true });
				}
			}

			// Create hard link: both source and target now point to the same inode
			// This is NOT a copy - they share the same file content on disk
			fs.linkSync(sourceFullPath, targetFullPath);
			successCount++;
			results.push(`[OK] ${platform.name}: ${targetPath}`);
		} catch (error) {
			results.push(`[FAIL] ${platform.name}: ${error.message}`);
		}
	}

	showResults(results);
	console.log(
		`Synced to ${successCount}/${selectedPlatforms.length} platform(s)`,
	);
}

/**
 * Main entry point
 *
 * Process:
 * 1. Parse command-line argument for source file (or use default)
 * 2. Validate source file exists
 * 3. Launch interactive platform selection
 * 4. Selected platforms are synced via hard links
 */
async function main() {
	// Validate source file exists before launching interactive menu
	const sourceFullPath = path.join(rootPath, "prompts/instructions.md");
	if (!fs.existsSync(sourceFullPath)) {
		console.error(`[ERROR] Source file not found: prompts/instructions.md\n`);
		process.exit(1);
	}

	// Launch interactive platform selection and sync
	await syncFiles();
}

// Execute main function and catch any unhandled errors
main().catch(console.error);
