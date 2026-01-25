import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigureCommand } from './configure';

// Mock dependencies
const mockConfigManager = {
  loadConfig: vi.fn(),
  updateConfig: vi.fn(),
};

const mockPlexClient = {
  testConnection: vi.fn(),
};

vi.mock('../client/configure', () => ({
  ConfigManager: class {
    loadConfig = mockConfigManager.loadConfig;
    updateConfig = mockConfigManager.updateConfig;
  },
}));

vi.mock('../client/plex', () => ({
  PlexClient: class {
    testConnection = mockPlexClient.testConnection;
  },
}));

describe('ConfigureCommand', () => {
  let configureCommand: ConfigureCommand;

  beforeEach(() => {
    // @ts-expect-error
    configureCommand = new ConfigureCommand();
    vi.clearAllMocks();
  });

  describe('performConfiguration', () => {
    it('should return true when configuration and connection test succeed', async () => {
      // Arrange
      const serverUrl = 'http://localhost:32400';
      const token = 'valid-token-123';
      mockPlexClient.testConnection.mockResolvedValue(true);

      // Act
      const result = await configureCommand.performConfiguration(serverUrl, token);

      // Assert
      expect(result).toBe(true);
      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockConfigManager.updateConfig).toHaveBeenCalledWith({
        serverUrl,
        token,
      });
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
    });

    it('should return false when connection test fails', async () => {
      // Arrange
      const serverUrl = 'http://localhost:32400';
      const token = 'invalid-token';
      mockPlexClient.testConnection.mockResolvedValue(false);

      // Act
      const result = await configureCommand.performConfiguration(serverUrl, token);

      // Assert
      expect(result).toBe(false);
      expect(mockConfigManager.updateConfig).toHaveBeenCalled();
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('should return true when Plex connection succeeds', async () => {
      // Arrange
      mockPlexClient.testConnection.mockResolvedValue(true);

      // Act
      const result = await configureCommand.testConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
    });

    it('should return false when Plex connection fails', async () => {
      // Arrange
      mockPlexClient.testConnection.mockResolvedValue(false);

      // Act
      const result = await configureCommand.testConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockPlexClient.testConnection).toHaveBeenCalled();
    });
  });
});
