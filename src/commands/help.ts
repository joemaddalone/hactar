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
		console.log(styleText(["gray"], "get plex stats\n"));

		this.logInfo("Available Commands:");

		const commands = [
			{
				name: "configure",
				description: "Set up Plex API credentials and preferences",
				usage: "hactar configure [options]",
			},
			{
				name: "scan",
				description: "Scan your Plex library for films",
				usage: "hactar search <title> [options]",
			},
			{
				name: "help",
				description: "Show this help information",
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
		console.log("  3. Select a film and save the data locally");
		console.log("");

		this.logInfo("Examples:");
		console.log(styleText(["gray"], "  # Scan your library"));
		console.log("  hactar scan");
		console.log("");
		console.log(styleText(["gray"], "  # Configure with custom settings"));
		console.log("  hactar configure --token YOUR_TOKEN --server YOUR_SERVER");
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
				description: "Configure Plex API credentials and application settings",
				usage: "hactar configure [options]",
				options: [
					{ flag: "-t, --token <key>", description: "Plex token" },
					{
						flag: "-s, --server <path>",
						description: "Plex server url",
					},
				],
				examples: [
					"hactar configure",
					"hactar configure --token YOUR_TOKEN --server YOUR_SERVER",
				],
			},
			scan: {
				description: "Scan your Plex library for films",
				usage: "hactar scan",
				options: [],
				examples: ["hactar scan"],
			},
			test: {
				description: "Test Plex API connection and credentials",
				usage: "hactar test",
				options: [],
				examples: ["hactar test"],
			},
			list: {
				description: "List all saved films",
				usage: "hactar list [options]",
				options: [
					{
						flag: "-o, --output <path>",
						description: "Output directory to list films from",
					},
					{ flag: "-s, --stats", description: "Show storage statistics" },
					{ flag: "-d, --delete", description: "Delete a film" },
				],
				examples: [
					"hactar list",
					"hactar list --stats",
					"hactar list --output ./movies",
					"hactar list --delete",
				],
			},
			export: {
				description: "Export saved film data to different formats or locations",
				usage: "hactar export [options]",
				options: [
					{
						flag: "-o, --output <path>",
						description: "Output directory to export from",
					},
					{
						flag: "-d, --destination <path>",
						description: "Destination directory for export",
					},
					{
						flag: "-f, --format <format>",
						description: "Export format (json|csv|txt)",
					},
				],
				examples: [
					"hactar export",
					"hactar export --format csv",
					"hactar export --destination ./backup",
					"hactar export --output ./movies --format json",
				],
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
