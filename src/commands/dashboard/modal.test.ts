import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalManager } from './modal';

// Mock blessed
const mockModal = {
  hide: vi.fn(),
  show: vi.fn(),
  destroy: vi.fn(),
};

const mockScreen = {
  append: vi.fn(),
  render: vi.fn(),
};

vi.mock('blessed', () => ({
  box: vi.fn(() => mockModal),
  textbox: vi.fn(() => mockModal),
  button: vi.fn(() => mockModal),
  list: vi.fn(() => mockModal),
}));

describe('ModalManager', () => {
  let modalManager: ModalManager;

  beforeEach(() => {
    modalManager = new ModalManager();
    vi.clearAllMocks();
  });

  describe('modal state management', () => {
    it('should initialize with no modal visible', () => {
      // Act
      const state = modalManager.getState();

      // Assert
      expect(state.type).toBe('none');
      expect(state.visible).toBe(false);
      expect(state.data).toBeUndefined();
    });

    it('should update modal state when showing modal', () => {
      // Arrange
      const modalType = 'configure';
      const modalData = { serverUrl: 'http://localhost:32400' };

      // Act
      modalManager.showModal(modalType, modalData);
      const state = modalManager.getState();

      // Assert
      expect(state.type).toBe(modalType);
      expect(state.visible).toBe(true);
      expect(state.data).toEqual(modalData);
    });

    it('should hide modal and reset state', () => {
      // Arrange
      modalManager.showModal('scan', { libraryKey: '1' });

      // Act
      modalManager.hideModal();
      const state = modalManager.getState();

      // Assert
      expect(state.type).toBe('none');
      expect(state.visible).toBe(false);
      expect(state.data).toBeUndefined();
    });

    it('should check if modal is visible', () => {
      // Arrange
      expect(modalManager.isVisible()).toBe(false);

      // Act
      modalManager.showModal('configure');

      // Assert
      expect(modalManager.isVisible()).toBe(true);
    });
  });

  describe('modal creation and rendering', () => {
    it('should create modal widget and return it', () => {
      // Act
      const result = modalManager.createModal(mockScreen as any, 'configure');

      // Assert
      expect(result).toBeDefined();
      expect(result).toBeTruthy();
    });

    it('should show modal widget when modal becomes visible', () => {
      // Arrange
      modalManager.createModal(mockScreen as any, 'configure');

      // Act
      modalManager.showModal('configure');

      // Assert
      expect(mockModal.show).toHaveBeenCalled();
      expect(mockScreen.render).toHaveBeenCalled();
    });

    it('should hide modal widget when modal is hidden', () => {
      // Arrange
      modalManager.createModal(mockScreen as any, 'configure');
      modalManager.showModal('configure');

      // Act
      modalManager.hideModal();

      // Assert
      expect(mockModal.hide).toHaveBeenCalled();
      expect(mockScreen.render).toHaveBeenCalled();
    });
  });

  describe('modal backdrop', () => {
    it('should create backdrop when showing modal', () => {
      // Act
      modalManager.createModal(mockScreen as any, 'configure');
      modalManager.showModal('configure');

      // Assert
      expect(modalManager.hasBackdrop()).toBe(true);
    });
  });

  describe('modal positioning', () => {
    it('should center modal on screen', () => {
      // Act
      modalManager.createModal(mockScreen as any, 'configure');
      
      // Assert
      expect(modalManager.isModalCentered()).toBe(true);
    });
  });

  describe('progress indicator', () => {
    it('should show progress indicator during operations', () => {
      // Act
      modalManager.createModal(mockScreen as any, 'configure');
      modalManager.showProgress('Loading...');
      
      // Assert
      expect(modalManager.hasProgressIndicator()).toBe(true);
    });
  });
});
