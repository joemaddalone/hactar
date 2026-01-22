#!/usr/bin/env node

import { CommandRegistry } from "./commands";
import { Logger } from "./client/logger";
import packageJson from "../package.json";

async function main(): Promise<void> {
	try {
		Logger.log(
			["bold", "white", "underline"],
			`hactar v${packageJson.version}`,
		);
		Logger.log(["bold", "gray", "italic"], "Heroic hard drive savior");
		Logger.log(["bold", "gray", "italic"], "-".repeat(20));

		// Initialize command registry
		const registry = new CommandRegistry();

		// Run the CLI with command line arguments
		await registry.run(process.argv);
	} catch (error) {
		Logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	}
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	Logger.error(error instanceof Error ? error.message : "Unknown error");
	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	Logger.error(`Unhandled Rejection at: ${promise}`);
	Logger.error(`Reason: ${reason}`);
	process.exit(1);
});

// Run the main function
if (require.main === module) {
	main().catch((error) => {
		Logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	});
}
