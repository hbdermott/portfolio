/**
 * Responsive command menu overlay.
 * Desktop: left-side panel. Mobile: bottom bar.
 * Minimizable. Clicking a command injects it into the terminal.
 */
export class CommandMenu {
  private container: HTMLElement;
  private content: HTMLElement;
  private toggle: HTMLElement;
  private minimized = false;
  private onCommand: (cmd: string) => void;

  constructor(commands: string[], onCommand: (cmd: string) => void) {
    this.onCommand = onCommand;
    this.container = document.getElementById('command-menu')!;
    this.toggle = document.getElementById('command-menu-toggle')!;
    this.content = document.getElementById('command-menu-content')!;

    this.buildButtons(commands);
    this.setupToggle();
  }

  private buildButtons(commands: string[]): void {
    for (const cmd of commands) {
      const btn = document.createElement('button');
      btn.className = 'cmd-btn';
      btn.textContent = cmd;
      btn.addEventListener('click', () => this.onCommand(cmd));
      this.content.appendChild(btn);
    }
  }

  private setupToggle(): void {
    this.toggle.addEventListener('click', () => {
      this.minimized = !this.minimized;
      this.container.classList.toggle('minimized', this.minimized);
      this.toggle.textContent = this.minimized ? 'Commands ▲' : 'Commands ▼';
    });
  }
}
