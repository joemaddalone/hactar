import { styleText, type InspectColor } from "node:util";

export const Logger = {
	log(style: InspectColor | readonly InspectColor[], message: string): void {
		console.log(styleText(style, message));
	},
	info(message: string): void {
		this.log(["white"], `ℹ️ ${message}`);
	},
	results(message: string): void {
		this.log(["cyan", "bold"], `🎯 ${message}`);
	},
	success(message: string): void {
		this.log(["green"], `✅ ${message}`);
	},
	warning(message: string): void {
		this.log(["yellow"], `⚠️  ${message}`);
	},
	error(message: string): void {
		this.log(["red"], `❌ ${message}`);
	},
	debug(message: string): void {
		this.log(["gray"], `🔍 ${message}`);
	},
};
