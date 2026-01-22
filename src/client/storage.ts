import { Filets } from "@joemaddalone/filets";
import type { LibraryScanResult } from "../types";
import os from "node:os";

export class StorageClient {
	private storageDir: string;

	constructor() {
		this.storageDir = this.getConfigDirectory();
	}

	private getConfigDirectory(): string {
		const homeDir = os.homedir();
		const storageDir = Filets.joinPaths(homeDir, ".hactar", "storage");
		// Ensure config directory exists
		Filets.ensureDirectoryExists(storageDir);
		return storageDir;
	}

	public async saveLibrary(
		library: string | number,
		data: LibraryScanResult,
	): Promise<string> {
		const saved = data;

		try {
			// Write config file
			Filets.writeTextFile(
				`${this.storageDir}/${library}.json`,
				JSON.stringify(saved),
			);
			return `${this.storageDir}/${library}.json`;
		} catch (error) {
			throw new Error(
				`Failed to save library data: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	public async getLibraryData(
		library: string | number,
	): Promise<LibraryScanResult | null> {
		const filePath = `${this.storageDir}/${library}.json`;
		try {
			if (Filets.fileExists(filePath)) {
				return Filets.readJsonFile(filePath) as LibraryScanResult;
			}
			return null;
		} catch (error) {
			console.error(`Failed to read library data: ${error}`);
			return null;
		}
	}
}
