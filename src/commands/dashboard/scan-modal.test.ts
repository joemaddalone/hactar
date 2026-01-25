import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanModal } from './scan-modal';

// Mock ScanCommand
const mockScanCommand = {
  getAvailableLibraries: vi.fn(),
  performScan: vi.fn(),
};

vi.mock('../scan', () => ({
  ScanCommand: class {
    getAvailableLibraries = mockScanCommand.getAvailableLibraries;
    performScan = mockScanCommand.performScan;
  },
}));

describe('ScanModal', () => {
  let scanModal: ScanModal;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('modal creation', () => {
    it('should create ScanModal instance', () => {
      // Act
      scanModal = new ScanModal();

      // Assert
      expect(scanModal).toBeDefined();
      expect(scanModal).toBeInstanceOf(ScanModal);
    });
  });

  describe('library list widget', () => {
    it('should create library list', () => {
      // Arrange
      scanModal = new ScanModal();

      // Act
      const libraryList = scanModal.getLibraryList();

      // Assert
      expect(libraryList).toBeDefined();
      expect(libraryList).toBeTruthy();
    });
  });

  describe('ScanCommand integration', () => {
    it('should call getAvailableLibraries when loading libraries', async () => {
      // Arrange
      scanModal = new ScanModal();
      const mockLibraries = [
        { key: '1', title: 'Movies', type: 'movie' },
        { key: '2', title: 'TV Shows', type: 'show' },
      ];
      mockScanCommand.getAvailableLibraries.mockResolvedValue(mockLibraries);

      // Act
      const result = await scanModal.loadLibraries();

      // Assert
      expect(result).toEqual(mockLibraries);
      expect(mockScanCommand.getAvailableLibraries).toHaveBeenCalled();
    });

    it('should call performScan when executing scan', async () => {
      // Arrange
      scanModal = new ScanModal();
      const libraryKey = '1';
      const mockScanResult = {
        library: { key: '1', title: 'Movies', type: 'movie' },
        data: [
          { title: 'Movie 1', size: 1000000, type: 'movie' },
          { title: 'Movie 2', size: 2000000, type: 'movie' },
        ],
        totalSize: 3000000,
        totalItems: 2,
      };
      mockScanCommand.performScan.mockResolvedValue(mockScanResult);

      // Act
      const result = await scanModal.executeScan(libraryKey);

      // Assert
      expect(result).toEqual(mockScanResult);
      expect(mockScanCommand.performScan).toHaveBeenCalledWith(libraryKey);
    });
  });
});
