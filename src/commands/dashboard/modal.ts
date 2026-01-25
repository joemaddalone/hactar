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
  private serverUrlField: blessed.Widgets.TextboxElement | null = null;
  private tokenField: blessed.Widgets.TextboxElement | null = null;
  private saveButton: blessed.Widgets.ButtonElement | null = null;
  private errorDisplay: blessed.Widgets.BoxElement | null = null;
  private libraryList: blessed.Widgets.ListElement | null = null;
  private libraryData: Array<{ key: string, title: string; }> = [];
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

  public hideProgress(): void {
    if (this.progressWidget) {
      this.progressWidget.hide();
      this.progressWidget = null;
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  // Configure modal field access
  public getServerUrl(): string {
    return this.serverUrlField?.getValue() || '';
  }

  public setServerUrl(value: string): void {
    if (this.serverUrlField) {
      this.serverUrlField.setValue(value);
    }
  }

  public getToken(): string {
    return this.tokenField?.getValue() || '';
  }

  public setToken(value: string): void {
    if (this.tokenField) {
      this.tokenField.setValue(value);
    }
  }

  public getSaveButton(): blessed.Widgets.ButtonElement | null {
    return this.saveButton;
  }

  public validateConfigureForm(): string[] {
    const errors: string[] = [];

    const serverUrl = this.getServerUrl().trim();
    const token = this.getToken().trim();

    if (!serverUrl) {
      errors.push('Server URL is required');
    }

    if (!token) {
      errors.push('Token is required');
    }

    return errors;
  }

  public showErrors(errors: string[]): void {
    if (this.errorDisplay && errors.length > 0) {
      this.errorDisplay.setContent(errors.join(', '));
      this.errorDisplay.style.fg = 'red';
      this.errorDisplay.show();
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  public clearErrors(): void {
    if (this.errorDisplay) {
      this.errorDisplay.hide();
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  public async handleSaveClick(onSubmit: (serverUrl: string, token: string) => Promise<boolean>, onClose?: () => void): Promise<void> {
    // Clear any previous errors
    this.clearErrors();

    // Validate form
    const errors = this.validateConfigureForm();
    if (errors.length > 0) {
      this.showErrors(errors);
      return;
    }

    // Submit form data
    const serverUrl = this.getServerUrl();
    const token = this.getToken();
    const success = await onSubmit(serverUrl, token);

    // Show feedback based on result
    if (success) {
      this.showSuccess('Configuration saved successfully');
      // Close modal after successful save
      if (onClose) {
        setTimeout(() => onClose(), 1500); // Delay to show success message
      }
    } else {
      this.showErrors(['Failed to save configuration']);
    }
  }

  public showSuccess(message: string): void {
    if (this.errorDisplay) {
      this.errorDisplay.setContent(message);
      this.errorDisplay.style.fg = 'green';
      this.errorDisplay.show();
      if (this.screen) {
        this.screen.render();
      }
    }
  }


  public showModal(type: ModalType, data?: unknown): void {
    this.state = {
      type,
      visible: true,
      data,
    };

    if (this.modalWidget) {
      this.modalWidget.show();

      // Focus first input field for configure modal (only if focus method exists)
      if (type === 'configure' && this.serverUrlField && 'focus' in this.serverUrlField) {
        setTimeout(() => {
          (this.serverUrlField as { focus(): void }).focus();
          if (this.screen) {
            this.screen.render();
          }
        }, 100);
      }

      // Focus library list for scan modal
      if (type === 'scan' && this.libraryList && 'focus' in this.libraryList) {
        setTimeout(() => {
          (this.libraryList as { focus(): void }).focus();
          if (this.screen) {
            this.screen.render();
          }
        }, 100);
      }

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
    this.serverUrlField = blessed.textbox({
      parent: this.modalWidget,
      top: 2,
      left: 2,
      width: '90%',
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'cyan' }, bg: 'black', fg: 'white' }
      },
      label: ' Server URL ',
      inputOnFocus: true,
      keys: true,
      mouse: true,
    });

    // Token input
    this.tokenField = blessed.textbox({
      parent: this.modalWidget,
      top: 6,
      left: 2,
      width: '90%',
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        focus: { border: { fg: 'cyan' }, bg: 'black', fg: 'white' }
      },
      label: ' Token ',
      secret: true,
      inputOnFocus: true,
      keys: true,
      mouse: true,
    });

    // Use keypress event to intercept tab before textbox processes it
    if (this.serverUrlField && 'on' in this.serverUrlField) {
      (this.serverUrlField as { on(event: string, callback: (ch: unknown, key: unknown) => void): void }).on('keypress', (_ch: unknown, key: unknown) => {
        if ((key as { name?: string })?.name === 'tab') {
          if (this.tokenField && 'focus' in this.tokenField) {
            (this.tokenField as { focus(): void }).focus();
          }
        }
      });
    }

    if (this.tokenField && 'on' in this.tokenField) {
      (this.tokenField as { on(event: string, callback: (ch: unknown, key: unknown) => void): void }).on('keypress', (_ch: unknown, key: unknown) => {
        if ((key as { name?: string })?.name === 'tab') {
          if (this.saveButton && 'focus' in this.saveButton) {
            (this.saveButton as { focus(): void }).focus();
          }
        }
      });
    }

    // Save button
    this.saveButton = blessed.button({
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
      keys: true,
      mouse: true,
    });

    // Error display
    this.errorDisplay = blessed.box({
      parent: this.modalWidget,
      top: 14,
      left: 2,
      width: '90%',
      height: 3,
      content: '',
      style: { fg: 'red' },
      hidden: true,
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

    if (this.saveButton && 'on' in this.saveButton) {
      (this.saveButton as { on(event: string, callback: (ch: unknown, key: unknown) => void): void }).on('keypress', (_ch: unknown, key: unknown) => {
        if ((key as { name?: string })?.name === 'tab') {
          if (this.serverUrlField && 'focus' in this.serverUrlField) {
            (this.serverUrlField as { focus(): void }).focus();
          }
        }
      });
    }
  }

  private createScanContent(): void {
    if (!this.modalWidget) return;

    // Library list
    this.libraryList = blessed.list({
      parent: this.modalWidget,
      top: 1,
      left: 2,
      width: '90%',
      height: '80%',
      border: { type: 'line' },
      style: {
        border: { fg: 'white' },
        selected: { bg: 'blue' },
        focus: { border: { fg: 'cyan' } }
      },
      label: ' Select Library ',
      items: ['Loading libraries...'],
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
    });

    // Focus the library list when modal is shown
    if (this.libraryList && 'focus' in this.libraryList) {
      setTimeout(() => {
        (this.libraryList as { focus(): void }).focus();
        if (this.screen) {
          this.screen.render();
        }
      }, 100);
    }

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

  // Scan modal library loading
  public async loadLibraries(getLibraries: () => Promise<Array<{ key: string, title: string; }>>): Promise<void> {
    try {
      const libraries = await getLibraries();
      this.updateLibraryList(libraries);
    } catch (_error) {
      this.updateLibraryList([]);
      if (this.libraryList) {
        this.libraryList.setItems(['Error loading libraries']);
        if (this.screen) {
          this.screen.render();
        }
      }
    }
  }

  public updateLibraryList(libraries: Array<{ key: string, title: string; }>): void {
    this.libraryData = libraries;

    if (this.libraryList) {
      const items = libraries.length > 0
        ? libraries.map(lib => `${lib.title} (${lib.key})`)
        : ['No libraries found'];

      this.libraryList.setItems(items);
      if (this.screen) {
        this.screen.render();
      }
    }
  }

  public getSelectedLibraryKey(): string | null {
    if (!this.libraryList || this.libraryData.length === 0) {
      return null;
    }

    // Use type assertion through unknown for blessed list widget
    const selectedIndex = (this.libraryList as unknown as { selected: number }).selected || 0;
    const selectedLibrary = this.libraryData[selectedIndex];
    return selectedLibrary ? selectedLibrary.key : null;
  }

  // Scan execution
  public async handleScanClick(onScan: (libraryKey: string) => Promise<boolean>, onClose?: () => void, onRefresh?: () => void): Promise<void> {
    const selectedKey = this.getSelectedLibraryKey();

    if (!selectedKey) {
      this.showErrors(['Please select a library to scan']);
      return;
    }

    // Show progress during scan
    this.showProgress('Scanning library...');

    try {
      const success = await onScan(selectedKey);

      if (success) {
        this.showSuccess('Scan completed successfully');
        // Close modal and refresh dashboard after successful scan
        if (onClose || onRefresh) {
          setTimeout(() => {
            if (onRefresh) onRefresh();
            if (onClose) onClose();
          }, 1500); // Delay to show success message
        }
      } else {
        this.showErrors(['Scan failed']);
      }
    } catch (_error) {
      this.showErrors(['Scan failed']);
    }
  }
}
