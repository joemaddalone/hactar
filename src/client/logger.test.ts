import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "./logger";
import { styleText } from "node:util";

describe("Logger", () => {
	let consoleSpy: any;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	describe("log", () => {
		it("should call console.log with styled text", () => {
			const style = "red";
			const message = "test message";
			Logger.log(style, message);
			expect(consoleSpy).toHaveBeenCalledWith(styleText(style, message));
		});

		it("should handle multiple styles", () => {
			const styles = ["red", "bold"] as const;
			const message = "bold red message";
			Logger.log(styles, message);
			expect(consoleSpy).toHaveBeenCalledWith(styleText(styles, message));
		});
	});

	describe("specialized methods", () => {
		it("info should log with white style and info icon", () => {
			Logger.info("info message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["white"], "ℹ️ info message"));
		});

		it("results should log with cyan bold style and target icon", () => {
			Logger.results("result message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["cyan", "bold"], "🎯 result message"));
		});

		it("success should log with green style and check icon", () => {
			Logger.success("success message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["green"], "✅ success message"));
		});

		it("warning should log with yellow style and warning icon", () => {
			Logger.warning("warning message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["yellow"], "⚠️  warning message"));
		});

		it("error should log with red style and cross icon", () => {
			Logger.error("error message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["red"], "❌ error message"));
		});

		it("debug should log with gray style and search icon", () => {
			Logger.debug("debug message");
			expect(consoleSpy).toHaveBeenCalledWith(styleText(["gray"], "🔍 debug message"));
		});
	});
});
