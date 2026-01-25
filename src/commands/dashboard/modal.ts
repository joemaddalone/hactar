import * as blessed from 'blessed';
import type { ModalType, ModalState } from './types';

export class ModalManager {
  private state: ModalState = {
    type: 'none',
    visible: false,
    data: undefined,
  };

  private modalWidget: blessed.Widgets.BoxElement | null = null;
  private backdropWidget: blessed.Widgets.BoxElement | null = null;
  private progressWidget: blessed.Widgets.BoxElement | null = null;
  private screen: blessed.Widgets.Screen | null = null;

  public getState(): ModalState {
    return { ...this.state };
  }

  public isVisible(): boolean {
    return this.state.visible;
  }

  public hasBackdrop(): boolean {
    return this.backdropWidget !== null;
  }

  public isModalCentered(): boolean {
    return this.modalWidget !== null;
  }

  public showProgress(message: string): void {
    if (this.screen && !this.progressWidget) {
      this.progressWidget = blessed.box({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: 30,
        height: 3,
        content: message,
        border: { type: 'line' },
        style: {
          border: { fg: 'yellow' },
          bg: 'black',
        },
        tags: true,
      });
      this.screen.render();
    }
  }

  public hasProgressIndicator(): boolean {
    return this.progressWidget !== null;
  }


  // biome-ignore lint/suspicious/noExplicitAny: i dont care.
  public showModal(type: ModalType, data?: any): void {
    this.state = {
      type,
      visible: true,
      data,
    };

    if (this.modalWidget) {
      this.modalWidget.show();
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  public hideModal(): void {
    this.state = {
      type: 'none',
      visible: false,
      data: undefined,
    };

    if (this.modalWidget) {
      this.modalWidget.hide();
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  public createModal(screen: blessed.Widgets.Screen, type: ModalType): blessed.Widgets.BoxElement {
    this.screen = screen;

    // Create backdrop
    this.backdropWidget = blessed.box({
      parent: screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black',
        transparent: true,
      },
      hidden: true,
    });

    const label = type === 'configure' ? ' Configure ' : ' Scan ';

    this.modalWidget = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: '50%',
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        bg: 'black',
      },
      hidden: true,
      tags: true,
      label,
    });

    // Add content based on modal type
    if (type === 'configure') {
      this.createConfigureContent();
    } else if (type === 'scan') {
      this.createScanContent();
    }

    return this.modalWidget;
  }

  private createConfigureContent(): void {
    if (!this.modalWidget) return;

    // Server URL input
    blessed.textbox({
      parent: this.modalWidget,
      top: 2,
      left: 2,
      width: '90%',
      height: 3,
      border: { type: 'line' },
      style: { border: { fg: 'white' } },
      label: ' Server URL ',
      inputOnFocus: true,
    });

    // Token input
    blessed.textbox({
      parent: this.modalWidget,
      top: 6,
      left: 2,
      width: '90%',
      height: 3,
      border: { type: 'line' },
      style: { border: { fg: 'white' } },
      label: ' Token ',
      secret: true,
      inputOnFocus: true,
    });

    // Save button
    blessed.button({
      parent: this.modalWidget,
      top: 10,
      left: 2,
      width: 12,
      height: 3,
      content: 'Save',
      border: { type: 'line' },
      style: {
        border: { fg: 'green' },
        focus: { bg: 'green', fg: 'black' }
      },
    });

    // Instructions
    blessed.box({
      parent: this.modalWidget,
      bottom: 1,
      left: 2,
      width: '90%',
      height: 2,
      content: 'Tab: Next field | Enter: Save | Escape: Cancel',
      style: { fg: 'yellow' },
    });
  }

  private createScanContent(): void {
    if (!this.modalWidget) return;

    // Library list
    blessed.list({
      parent: this.modalWidget,
      top: 1,
      left: 2,
      width: '90%',
      height: '80%',
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        selected: { bg: 'blue' }
      },
      label: ' Select Library ',
      items: ['Loading libraries...'],
      keys: true,
      vi: true,
    });

    // Instructions
    blessed.box({
      parent: this.modalWidget,
      bottom: 1,
      left: 2,
      width: '90%',
      height: 2,
      content: '↑↓: Select | Enter: Scan | Escape: Cancel',
      style: { fg: 'yellow' },
    });
  }
}
