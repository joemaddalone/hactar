import { Command } from "commander";
import { BaseCommand } from "./base-command";
import { ConfigManager } from "../client/configure";
import { PlexClient } from "../client/plex";

export class TestCommand extends BaseCommand {
	protected createCommand(): Command {
		return new Command("test")
			.description("Test Plex connection and credentials")
			.action(async () => {
				await this.runWithErrorHandling();
			});
	}

	protected async execute(): Promise<void> {
		this.logInfo("Testing hactar configuration and Plex API connection...\n");

		// Test configuration
		const configManager = new ConfigManager();

		try {
			await configManager.loadConfig();
			this.logSuccess("Configuration loaded successfully");
			this.logInfo(`Config directory: ${configManager.getConfigDirectory()}`);
		} catch (error) {
			this.logError("Failed to load configuration");
			this.logDebug(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		// Test credentials
		try {
			const credentials = await configManager.getCredentials();
			if (credentials?.token) {
				this.logSuccess("Credentials found");
				this.logInfo(
					`Token: ***${credentials.token.slice(-4)}\n    Server URL: ${credentials.serverUrl}`,
				);
			} else {
				this.logWarning("No Credentials key found");
				this.logInfo('Run "hactar configure" to set up your Plex token');
				return;
			}
		} catch (error) {
			this.logError("Failed to access credentials");
			this.logDebug(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		// Test API connection
		try {
			const credentials = await configManager.getCredentials();
			if (!credentials?.token || !credentials.serverUrl) {
				this.logWarning("Cannot test connection without credentials");
				return;
			}

			const plexClient = new PlexClient();
			const isConnected = await plexClient.testConnection();

			if (isConnected) {
				this.logSuccess("Plex API connection successful");

				// Test a simple search
				this.logInfo("Testing library search...");
				try {
					const results = await plexClient.getLibraries();
					this.logSuccess(
						`Search test successful - Found ${results.length} results`,
					);
					this.logInfo(`Libraries: ${results.map((r) => r.title).join(", ")}`);
				} catch (error) {
					this.logWarning("Search test failed");
					this.logDebug(
						`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			} else {
				this.logError("Plex API connection failed");
				this.logInfo("  Please check your API key and internet connection");
			}
		} catch (error) {
			this.logError("Plex API test failed");
			this.logDebug(
				`Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		this.logResults("Test completed!");
	}
}
