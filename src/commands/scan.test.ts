import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanCommand } from './scan';
import type { PlexLibraryResponse, LibraryScanResult } from '../types';

// Mock dependencies
const mockPlexClient = {
  testConnection: vi.fn(),
  getLibraries: vi.fn(),
  getLibraryItems: vi.fn(),
};

const mockStorageClient = {
  saveLibrary: vi.fn(),
};

vi.mock('../client/plex', () => ({
  PlexClient: class {
    testConnection = mockPlexClient.testConnection;
    getLibraries = mockPlexClient.getLibraries;
    getLibraryItems = mockPlexClient.getLibraryItems;
  },
}));

vi.mock('../client/storage', () => ({
  StorageClient: class {
    saveLibrary = mockStorageClient.saveLibrary;
  },
}));

describe('ScanCommand', () => {
  let scanCommand: ScanCommand;

  beforeEach(() => {
    scanCommand = new ScanCommand();
    vi.clearAllMocks();
  });

  describe('getAvailableLibraries', () => {
    it('should return libraries when connection is successful', async () => {
      // Arrange
      const mockLibraries: PlexLibraryResponse[] = [
        { key: '1', title: 'Movies', type: 'movie' },
        { key: '2', title: 'TV Shows', type: 'show' },
      ];
      mockPlexClient.testConnection.mockResolvedValue(true);
      mockPlexClient.getLibraries.mockResolvedValue(mockLibraries);

      // Act
      const result = await scanCommand.getAvailableLibraries();

      // Assert
      expect(result).toEqual(mockLibraries);
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
      expect(mockPlexClient.getLibraries).toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      // Arrange
      mockPlexClient.testConnection.mockResolvedValue(false);

      // Act & Assert
      await expect(scanCommand.getAvailableLibraries()).rejects.toThrow('Plex connection failed');
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
      expect(mockPlexClient.getLibraries).not.toHaveBeenCalled();
    });
  });

  describe('performScan', () => {
    it('should scan library and return results', async () => {
      // Arrange
      const libraryKey = '1';
      const mockLibrary: Partial<PlexLibraryResponse> = { key: '1', title: 'Movies', type: 'movie' };
      const mockScanResult: LibraryScanResult = {
        library: mockLibrary,
        data: [
          { title: 'Movie 1', size: 1000000, type: 'movie' },
          { title: 'Movie 2', size: 2000000, type: 'movie' },
        ],
        totalSize: 3000000,
        totalItems: 2,
      };

      mockPlexClient.getLibraryItems.mockResolvedValue(mockScanResult);

      // Act
      const result = await scanCommand.performScan(libraryKey);

      // Assert
      expect(result).toEqual(mockScanResult);
      expect(mockPlexClient.getLibraryItems).toHaveBeenCalledWith(libraryKey);
      expect(mockStorageClient.saveLibrary).toHaveBeenCalledWith(libraryKey.key, mockScanResult);
    });
  });
});
