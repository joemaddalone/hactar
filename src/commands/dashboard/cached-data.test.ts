import { describe, it, expect, vi } from "vitest";
import { loadCachedData } from "./cached-data";

describe("cached-data", () => {
	it("should load cached data and calculate totals", async () => {
		const mockStorageClient = {
			getLibraries: vi.fn().mockResolvedValue([
				{ key: "1", libraryName: "Movies" },
				{ key: "2", libraryName: "TV Shows" },
			]),
			getLibraryData: vi.fn()
				.mockResolvedValueOnce({ bytes: 1000, files: 10, data: [] })
				.mockResolvedValueOnce({ bytes: 2000, files: 20, data: [] }),
		};

		const result = await loadCachedData(mockStorageClient as any);

		expect(result.cachedLibraryData).toHaveLength(2);
		expect(result.totalSize).toBe(3000);
		expect(result.totalFiles).toBe(30);
		expect(result.cachedLibraryData[0].title).toBe("Movies");
		expect(result.cachedLibraryData[1].title).toBe("TV Shows");
	});

	it("should handle empty libraries", async () => {
		const mockStorageClient = {
			getLibraries: vi.fn().mockResolvedValue([]),
			getLibraryData: vi.fn(),
		};

		const result = await loadCachedData(mockStorageClient as any);

		expect(result.cachedLibraryData).toHaveLength(0);
		expect(result.totalSize).toBe(0);
		expect(result.totalFiles).toBe(0);
	});
});
