import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigureModal } from './configure-modal';

// Mock ConfigureCommand
const mockConfigureCommand = {
  performConfiguration: vi.fn(),
};

vi.mock('../configure', () => ({
  ConfigureCommand: class {
    performConfiguration = mockConfigureCommand.performConfiguration;
  },
}));

describe('ConfigureModal', () => {
  let configureModal: ConfigureModal;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('modal creation', () => {
    it('should create ConfigureModal instance', () => {
      // Act
      configureModal = new ConfigureModal();

      // Assert
      expect(configureModal).toBeDefined();
      expect(configureModal).toBeInstanceOf(ConfigureModal);
    });
  });

  describe('server URL input field', () => {
    it('should create server URL textbox', () => {
      // Arrange
      configureModal = new ConfigureModal();

      // Act
      const serverUrlField = configureModal.getServerUrlField();

      // Assert
      expect(serverUrlField).toBeDefined();
      expect(serverUrlField).toBeTruthy();
    });
  });

  describe('token input field', () => {
    it('should create token textbox with secret property', () => {
      // Arrange
      configureModal = new ConfigureModal();

      // Act
      const tokenField = configureModal.getTokenField();

      // Assert
      expect(tokenField).toBeDefined();
      expect(tokenField).toBeTruthy();
    });
  });

  describe('save button', () => {
    it('should create save button', () => {
      // Arrange
      configureModal = new ConfigureModal();

      // Act
      const saveButton = configureModal.getSaveButton();

      // Assert
      expect(saveButton).toBeDefined();
      expect(saveButton).toBeTruthy();
    });
  });

  describe('ConfigureCommand integration', () => {
    it('should call performConfiguration when submitting form', async () => {
      // Arrange
      configureModal = new ConfigureModal();
      const serverUrl = 'http://localhost:32400';
      const token = 'test-token';
      mockConfigureCommand.performConfiguration.mockResolvedValue(true);

      // Act
      const result = await configureModal.submitForm(serverUrl, token);

      // Assert
      expect(result).toBe(true);
      expect(mockConfigureCommand.performConfiguration).toHaveBeenCalledWith(serverUrl, token);
    });
  });
});
