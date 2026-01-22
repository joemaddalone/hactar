import type { Command } from "commander";
import { Logger } from "../client/logger";

export abstract class BaseCommand {
	protected program: Command;
	protected command: Command;

	constructor(program: Command) {
		this.program = program;
		this.command = this.createCommand();
	}

	protected abstract createCommand(): Command;
	protected abstract execute(...args: unknown[]): Promise<void>;

	protected async runWithErrorHandling(...args: unknown[]): Promise<void> {
		try {
			await this.execute(...args);
		} catch (error) {
			await this.handleError(error as Error);
			process.exit(1);
		}
	}

	protected async handleError(error: Error): Promise<void> {
		Logger.error(error.message);
	}

	protected logInfo(message: string): void {
		Logger.info(message);
	}

	protected logResults(message: string): void {
		Logger.results(message);
	}

	protected logSuccess(message: string): void {
		Logger.success(message);
	}

	protected logWarning(message: string): void {
		Logger.warning(message);
	}

	protected logError(message: string): void {
		Logger.error(message);
	}

	protected logDebug(message: string): void {
		Logger.debug(message);
	}

	protected async offerConfiguration(): Promise<void> {
		const { confirm } = await import("@inquirer/prompts");

		const shouldConfigure = await confirm({
			message: "hactar has not yet been configured. Would you like to configure it now?",
			default: true,
		});

		if (shouldConfigure) {
			this.logInfo("Starting configuration...");
			// Import and execute the configure command
			const { ConfigureCommand } = await import("./configure");
			const configureCmd = new ConfigureCommand(this.program);
			await configureCmd.configure();
		} else {
			this.logInfo("Configuration skipped. Run 'hactar configure' when ready.");
		}
	}

	public getCommand(): Command {
		return this.command;
	}
}
