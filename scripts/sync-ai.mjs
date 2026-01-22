#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const platforms = [
	{
		id: "copilot",
		name: "GitHub Copilot",
		targetPath: ".github/copilot-instructions.md",
		dirPath: ".github",
		useSourceFilename: false,
		selected: true,
	},
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..");
const sourcePath = path.join(rootPath, "prompts/instructions.md");

const exists = async (p) => {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
};

const ensureDir = async (dir) => {
	await fs.mkdir(dir, { recursive: true });
};

const linkOrCopy = async (src, dest) => {
	try {
		await fs.link(src, dest);
	} catch (err) {
		// Cross-device link or other restrictions; fallback to copy
		if (err.code === "EXDEV" || err.code === "EPERM" || err.code === "EACCES") {
			await fs.copyFile(src, dest);
			return;
		}
		throw err;
	}
};

const formatTarget = (platform) => {
	if (platform.useSourceFilename)
		return path.join(platform.dirPath, path.basename(sourcePath));
	return platform.targetPath || `${platform.id.toUpperCase()}.MD`;
};

const syncPlatform = async (platform) => {
	const targetPath = formatTarget(platform);
	const targetFull = path.join(rootPath, targetPath);
	try {
		if (await exists(targetFull)) await fs.unlink(targetFull);
		if (platform.dirPath)
			await ensureDir(path.join(rootPath, platform.dirPath));
		await linkOrCopy(sourcePath, targetFull);
		return { ok: true, name: platform.name, target: targetPath };
	} catch (err) {
		return {
			ok: false,
			name: platform.name,
			target: targetPath,
			error: err.message,
		};
	}
};

const showResults = (results) => {
	console.log("\n=== Results ===\n");
	for (const r of results) {
		if (r.ok) console.log(`  ✅ ${r.name}: ${r.target}`);
		else console.log(`  ❌ ${r.name}: ${r.error}`);
	}
	console.log("");
};

const syncFiles = async () => {
	if (!(await exists(sourcePath))) {
		console.error(`[ERROR] Source file not found: prompts/instructions.md`);
		process.exit(1);
	}

	const selected = platforms.filter((p) => p.selected);
	if (selected.length === 0) {
		console.log("[!] No platforms selected. Exiting.");
		return;
	}

	const tasks = selected.map((p) => syncPlatform(p));
	const results = await Promise.all(tasks);
	showResults(results);
	const successCount = results.filter((r) => r.ok).length;
	console.log(`Synced to ${successCount}/${selected.length} platform(s)`);
};

const main = async () => {
	if (!(await exists(sourcePath))) {
		console.error(`[ERROR] Source file not found: prompts/instructions.md\n`);
		process.exit(1);
	}
	await syncFiles();
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
