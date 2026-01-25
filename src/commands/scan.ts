// scans for libraries, returns selectable list
import { Command } from "commander";
import { BaseCommand } from "./base-command";
import { PlexClient } from "../client/plex";
import { StorageClient } from "../client/storage";
import { select } from "@inquirer/prompts";
import type { LibraryScanResult, PlexLibraryResponse } from "../types";

export class ScanCommand extends BaseCommand {
	protected createCommand(): Command {
		return new Command("scan")
			.description("Scan for libraries")
			.action(async () => {
				await this.runWithErrorHandling();
			});
	}

	protected async execute(): Promise<void> {
		this.logInfo("Scanning for libraries...");

		try {
			const libraries = await this.getAvailableLibraries();
			await this.displayLibraries(libraries);
		} catch (_error) {
			await this.offerConfiguration();
			return;
		}
	}

	protected async displayLibraries(
		libraries: PlexLibraryResponse[],
	): Promise<void> {
		const choices = [];
		choices.push({
			name: "Cancel",
			value: "CANCEL",
		});
		choices.push(
			...libraries.map((library) => ({
				name: library.title,
				value: library.key,
			})),
		);
		const answer = await select({
			message: "Select a library to scan",
			choices,
			pageSize: 10,
		});

		if (answer === "CANCEL") {
			this.logInfo("Scan cancelled");
			return;
		}

		const library = libraries.find((library) => library.key === answer);
		if (!library) {
			this.logError("Library not found");
			return;
		}

		const results = await this.performScan(library.key);
		this.logInfo(`Found ${results.data.length} items`);
	}

	public async getAvailableLibraries(): Promise<PlexLibraryResponse[]> {
		const plexClient = new PlexClient();

		const isConfigured = await plexClient.testConnection();
		if (!isConfigured) {
			throw new Error('Plex connection failed');
		}

		return await plexClient.getLibraries();
	}

	public async performScan(libraryKey: string): Promise<LibraryScanResult> {
		const plexClient = new PlexClient();

		const results = await plexClient.getLibraryItems({ key: libraryKey } as PlexLibraryResponse);
		const storageClient = new StorageClient();
		await storageClient.saveLibrary(libraryKey, results);

		return results;
	}
}
