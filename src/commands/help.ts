import { Command } from "commander";
import { styleText } from "node:util";
import { BaseCommand } from "./base-command";

interface CommandOption {
	flag: string;
	description: string;
}

interface CommandArgument {
	name: string;
	description: string;
}

interface CommandHelp {
	description: string;
	usage: string;
	options?: CommandOption[];
	arguments?: CommandArgument[];
	examples?: string[];
}

export class HelpCommand extends BaseCommand {
	protected createCommand(): Command {
		return new Command("help")
			.description("Show detailed help information")
			.argument("[command]", "Command to get help for")
			.action(async (command) => {
				await this.runWithErrorHandling(command);
			});
	}

	protected async execute(command?: string): Promise<void> {
		if (command) {
			await this.showCommandHelp(command);
		} else {
			await this.showGeneralHelp();
		}
	}

	private async showGeneralHelp(): Promise<void> {
		// Display ASCII art banner
		console.log(styleText(["blue", "bold"], "hactar"));
		console.log(styleText(["gray"], "Plex Library Management\n"));

		this.logInfo("Available Commands:");

		const commands = [
			{
				name: "configure",
				description:
					"Prompts for Plex Server URL and token, then stores them in ~/.hactar/config.json",
				usage: "hactar configure [options]",
			},
			{
				name: "scan",
				description:
					"Scans all known libraries, caches results locally, and displays a selectable list",
				usage: "hactar scan",
			},
			{
				name: "test",
				description:
					"Tests connectivity to the Plex server using stored credentials",
				usage: "hactar test",
			},
			{
				name: "dashboard",
				description:
					"Opens an interactive TUI dashboard showing storage statistics, library breakdowns and an item-by-item table. Requires a TTY",
				usage: "hactar dashboard",
			},
			{
				name: "help",
				description: "Displays help information for available commands",
				usage: "hactar help [command]",
			},
		];

		commands.forEach((cmd) => {
			console.log(
				styleText(["cyan"], `  ${cmd.name.padEnd(12)} ${cmd.description}`),
			);
			console.log(styleText(["gray"], `    Usage: ${cmd.usage}`));
			console.log("");
		});

		this.logInfo("Getting Started:");
		console.log('  1. Run "hactar configure" to set up your Plex token');
		console.log('  2. Use "hactar scan" to scan your library');
		console.log("");

		this.logInfo("Examples:");
		console.log(styleText(["gray"], "  # Scan your library"));
		console.log("  hactar scan");
		console.log("");

		this.logInfo("For more information:");
		console.log("  • Visit: https://github.com/joemaddalone/hactar");
		console.log("");

		this.logInfo("Need help?");
		console.log('  • Run "hactar help <command>" for command-specific help');
		console.log("  • Check the documentation for detailed examples");
	}

	private async showCommandHelp(commandName: string): Promise<void> {
		const commandHelp: Record<string, CommandHelp> = {
			configure: {
				description:
					"Prompts for Plex Server URL and token, then stores them in ~/.hactar/config.json",
				usage: "hactar configure [options]",
				options: [],
				examples: ["hactar configure"],
			},
			scan: {
				description:
					"Scans libraries, caches results locally, and displays a selectable list",
				usage: "hactar scan",
				options: [],
				examples: ["hactar scan"],
			},
			test: {
				description:
					"Tests connectivity to the Plex server using stored credentials",
				usage: "hactar test",
				options: [],
				examples: ["hactar test"],
			},
			dashboard: {
				description:
					"Opens an interactive TUI dashboard showing storage statistics, library breakdowns and an item-by-item table. Requires a TTY",
				usage: "hactar dashboard",
				options: [],
				examples: ["hactar dashboard"],
			},
		};

		const help = commandHelp[commandName];

		if (!help) {
			this.logError(`Unknown command: ${commandName}`);
			this.logInfo('Run "hactar help" to see all available commands');
			return;
		}

		console.log(styleText(["cyan"], `Command: ${commandName}`));
		console.log(styleText(["gray"], help.description));
		console.log("");

		console.log(styleText(["yellow"], "Usage:"));
		console.log(`  ${help.usage}`);
		console.log("");

		if (help.arguments) {
			console.log(styleText(["yellow"], "Arguments:"));
			help.arguments.forEach((arg: CommandArgument) => {
				console.log(`  ${arg.name.padEnd(15)} ${arg.description}`);
			});
			console.log("");
		}

		if (help.options) {
			console.log(styleText(["yellow"], "Options:"));
			help.options.forEach((option: CommandOption) => {
				console.log(`  ${option.flag.padEnd(25)} ${option.description}`);
			});
			console.log("");
		}

		if (help.examples) {
			console.log(styleText(["yellow"], "Examples:"));
			help.examples.forEach((example: string) => {
				console.log(`  ${example}`);
			});
			console.log("");
		}

		this.logInfo("For general help, run: hactar help");
	}
}
