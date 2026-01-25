import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupKeyboardControls } from './keyboard';

// Mock blessed screen
const mockScreen = {
  key: vi.fn(),
};

// Mock callbacks
const mockCallbacks = {
  onOpenConfigureModal: vi.fn(),
  onOpenScanModal: vi.fn(),
  onCloseModal: vi.fn(),
  getState: vi.fn(() => ({ currentPage: 1, totalItems: 100, itemsPerPage: 20 })),
};

describe('setupKeyboardControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('modal keyboard controls', () => {
    it('should register c key for configure modal', () => {
      // Act
      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Assert
      expect(mockScreen.key).toHaveBeenCalledWith(['c'], expect.any(Function));
    });

    it('should call onOpenConfigureModal when c key is pressed', () => {
      // Arrange
      let cKeyHandler: (() => void) | undefined;
      mockScreen.key.mockImplementation((keys, handler) => {
        if (keys.includes('c')) {
          cKeyHandler = handler;
        }
      });

      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Act
      cKeyHandler?.();

      // Assert
      expect(mockCallbacks.onOpenConfigureModal).toHaveBeenCalled();
    });

    it('should register s key for scan modal', () => {
      // Act
      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Assert
      expect(mockScreen.key).toHaveBeenCalledWith(['s'], expect.any(Function));
    });

    it('should call onOpenScanModal when s key is pressed', () => {
      // Arrange
      let sKeyHandler: (() => void) | undefined;
      mockScreen.key.mockImplementation((keys, handler) => {
        if (keys.includes('s')) {
          sKeyHandler = handler;
        }
      });

      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Act
      sKeyHandler?.();

      // Assert
      expect(mockCallbacks.onOpenScanModal).toHaveBeenCalled();
    });

    it('should register escape key for closing modal', () => {
      // Act
      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Assert
      expect(mockScreen.key).toHaveBeenCalledWith(['escape'], expect.any(Function));
    });

    it('should call onCloseModal when escape key is pressed', () => {
      // Arrange
      let escapeKeyHandler: (() => void) | undefined;
      mockScreen.key.mockImplementation((keys, handler) => {
        if (keys.includes('escape')) {
          escapeKeyHandler = handler;
        }
      });

      setupKeyboardControls(mockScreen as any, mockCallbacks as any);

      // Act
      escapeKeyHandler?.();

      // Assert
      expect(mockCallbacks.onCloseModal).toHaveBeenCalled();
    });
  });
});
