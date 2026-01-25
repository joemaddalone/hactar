import { Filets } from "@joemaddalone/filets";
import * as os from "node:os";
import * as path from "node:path";
import type { UserConfig, ConfigFile } from "../types";

import { DEFAULT_USER_CONFIG, DEFAULT_APP_CONFIG } from "../types";

export class ConfigManager {
	private configDir: string;
	private configPath: string;

	constructor() {
		this.configDir = this.getConfigDirectory();
		this.configPath = path.join(this.configDir, "config.json");
	}

	public getConfigDirectory(): string {
		const homeDir = os.homedir();
		const configDir = Filets.joinPaths(homeDir, ".hactar");
		Filets.ensureDirectoryExists(configDir);
		return configDir;
	}

	public async loadConfig(): Promise<ConfigFile> {
		try {
			if (!Filets.fileExists(this.configPath)) {
				return this.createDefaultConfig();
			}

			const config = Filets.readJsonFile(this.configPath) as ConfigFile;
			return this.validateAndMergeConfig(config);
		} catch (error) {
			throw new Error(
				`Failed to load configuration: ${error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}

	public async saveConfig(config: ConfigFile): Promise<void> {
		try {
			Filets.ensureDirectoryExists(this.configDir);
			config.lastUpdated = new Date().toISOString();
			Filets.writeJsonFile(this.configPath, config);
		} catch (error) {
			throw new Error(
				`Failed to save configuration: ${error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}
	public async updateConfig(updates: Partial<UserConfig>): Promise<void> {
		const config = await this.loadConfig();
		config.user = { ...config.user, ...updates };
		await this.saveConfig(config);
	}

	public async getCredentials(): Promise<{
		token?: string;
		serverUrl?: string;
	} | null> {
		const config = await this.loadConfig();
		if (config?.user.token && config?.user.serverUrl) {
			return {
				token: config.user.token,
				serverUrl: config.user.serverUrl,
			};
		}
		console.log("No credentials found");
		return null;
	}

	public async isConfigured(): Promise<boolean> {
		const config = await this.loadConfig();
		return !!config.user.token && config.user.token.trim().length > 0;
	}

	private createDefaultConfig(): ConfigFile {
		return {
			user: { ...DEFAULT_USER_CONFIG },
			app: { ...DEFAULT_APP_CONFIG },
			lastUpdated: new Date().toISOString(),
		};
	}

	private validateAndMergeConfig(config: ConfigFile): ConfigFile {
		const validatedConfig: ConfigFile = {
			user: { ...DEFAULT_USER_CONFIG, ...config.user },
			app: { ...DEFAULT_APP_CONFIG, ...config.app },
			lastUpdated: config.lastUpdated || new Date().toISOString(),
		};

		if (!validatedConfig.user.token) {
			validatedConfig.user.token = "";
		}

		if (!validatedConfig.user.serverUrl) {
			validatedConfig.user.serverUrl = "";
		}

		return validatedConfig;
	}

	public getConfigPath(): string {
		return this.configPath;
	}
}
