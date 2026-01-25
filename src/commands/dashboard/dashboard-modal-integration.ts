import type { DashboardState, ModalState, ExtendedDashboardState } from './types';

export class DashboardModalIntegration {
  private dashboardState: DashboardState;
  private modalState: ModalState = {
    type: 'none',
    visible: false,
    data: undefined,
  };

  constructor(initialDashboardState: DashboardState) {
    this.dashboardState = initialDashboardState;
  }

  public getExtendedState(): ExtendedDashboardState {
    return {
      ...this.dashboardState,
      modalState: { ...this.modalState },
    };
  }

  public updateModalState(modalState: ModalState): void {
    this.modalState = { ...modalState };
  }

  public updateDashboardState(dashboardState: DashboardState): void {
    this.dashboardState = { ...dashboardState };
  }

  public isModalActive(): boolean {
    return this.modalState.visible;
  }
}
