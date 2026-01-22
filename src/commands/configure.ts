import { Command } from "commander";
import inquirer from "inquirer";
import { BaseCommand } from "./base-command";
import { ConfigManager } from "../client/configure";
import { PlexClient } from "../client/plex";

export class ConfigureCommand extends BaseCommand {
	protected createCommand(): Command {
		return new Command("configure")
			.description("Configure Plex API credentials and settings")
			.action(async (options) => {
				await this.runWithErrorHandling(options);
			});
	}

	protected async execute(): Promise<void> {
		await this.configure();
	}

	public async configure(): Promise<void> {
		this.logInfo("Configuring hactar...");

		let token = null;
		let server = null;

		if (!token) {
			const answers = await inquirer.prompt([
				{
					type: "password",
					name: "token",
					message: "Enter your Plex token:",
					validate: (input: string) => {
						if (!input || input.trim().length === 0) {
							return "Token is required";
						}
						if (input.length < 10) {
							return "API key seems too short";
						}
						return true;
					},
				},
			]);
			token = answers.token;
		}

		if (!server) {
			const answers = await inquirer.prompt([
				{
					type: "input",
					name: "server",
					message: "Enter your Plex server url:",
					default: "http://localhost:32400",
					validate: (input: string) => {
						if (!input || input.trim().length === 0) {
							return "Server url is required";
						}
						return true;
					},
				},
			]);
			server = answers.server;
		}

		this.validateToken(token);
		this.validateServer(server);

		const configManager = new ConfigManager();
		await configManager.loadConfig();
		await configManager.updateConfig({
			serverUrl: server,
			token: token,
		});

		this.logSuccess("Configuration completed successfully!");
		this.logInfo(`Token: ***${token.slice(-4)}`);
		this.logInfo(`Server: ${server}`);

		this.logInfo("Testing Plex API connection...");
		const plexClient = new PlexClient();
		const isConnected = await plexClient.testConnection();

		if (isConnected) {
			this.logSuccess("Plex API connection successful!");
			this.logInfo('You can now use "hactar scan" to scan your library!');
		} else {
			this.logWarning("Plex API connection failed. Please check your API key.");
		}
	}

	public validateToken(token: string): void {
		if (!token || token.trim().length === 0) {
			throw new Error("Token is required");
		}
		if (token.length < 10) {
			throw new Error("Token seems too short");
		}
	}

	public validateServer(server: string): void {
		if (!server || server.trim().length === 0) {
			throw new Error("Server url is required");
		}
	}
}
