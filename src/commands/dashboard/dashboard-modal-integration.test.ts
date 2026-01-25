import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardModalIntegration } from './dashboard-modal-integration';
import type { DashboardState, ModalState } from './types';

describe('DashboardModalIntegration', () => {
  let integration: DashboardModalIntegration;
  let mockDashboardState: DashboardState;

  beforeEach(() => {
    mockDashboardState = {
      currentPage: 1,
      totalItems: 100,
      itemsPerPage: 20,
      currentView: 'overall',
      currentSortColumn: 'title',
      sortDirection: 'asc',
      selectedTableIndex: 0,
      navigationState: {
        level: 'overall',
        libraryIndex: 0,
      },
    };

    integration = new DashboardModalIntegration(mockDashboardState);
  });

  describe('modal state integration', () => {
    it('should initialize with dashboard state and no modal', () => {
      // Act
      const state = integration.getExtendedState();

      // Assert
      expect(state.currentPage).toBe(1);
      expect(state.totalItems).toBe(100);
      expect(state.modalState.type).toBe('none');
      expect(state.modalState.visible).toBe(false);
    });

    it('should update modal state while preserving dashboard state', () => {
      // Arrange
      const modalState: ModalState = {
        type: 'configure',
        visible: true,
        data: { serverUrl: 'http://localhost:32400' },
      };

      // Act
      integration.updateModalState(modalState);
      const state = integration.getExtendedState();

      // Assert
      expect(state.currentPage).toBe(1); // Dashboard state preserved
      expect(state.modalState.type).toBe('configure');
      expect(state.modalState.visible).toBe(true);
      expect(state.modalState.data).toEqual({ serverUrl: 'http://localhost:32400' });
    });

    it('should update dashboard state while preserving modal state', () => {
      // Arrange
      integration.updateModalState({ type: 'scan', visible: true });
      const newDashboardState = { ...mockDashboardState, currentPage: 2 };

      // Act
      integration.updateDashboardState(newDashboardState);
      const state = integration.getExtendedState();

      // Assert
      expect(state.currentPage).toBe(2); // Dashboard state updated
      expect(state.modalState.type).toBe('scan'); // Modal state preserved
      expect(state.modalState.visible).toBe(true);
    });

    it('should check if modal is active', () => {
      // Arrange
      expect(integration.isModalActive()).toBe(false);

      // Act
      integration.updateModalState({ type: 'configure', visible: true });

      // Assert
      expect(integration.isModalActive()).toBe(true);
    });
  });
});
