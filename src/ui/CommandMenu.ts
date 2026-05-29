/**
 * Responsive command menu overlay with grouped, color-coded commands.
 *
 * Groups:
 *  - Portfolio (green): about, projects, experience, skills, contact, help
 *  - Effects & Games (amber): matrix, glitch, snake, clear
 *  - Linux (blue): ls, cd, pwd, cat, mkdir, touch, rm, echo, whoami, date, uname
 *
 * Clicking any command interrupts active modes (matrix/snake) and
 * returns to the terminal before injecting the command.
 */
export interface CommandGroup {
  name: string;
  color: string;
  commands: string[];
}

export class CommandMenu {
  private container: HTMLElement;
  private content: HTMLElement;
  private toggle: HTMLElement;
  private minimized = false;
  private onCommand: (cmd: string) => void;

  constructor(groups: CommandGroup[], onCommand: (cmd: string) => void) {
    this.onCommand = onCommand;
    this.container = document.getElementById('command-menu')!;
    this.toggle = document.getElementById('command-menu-toggle')!;
    this.content = document.getElementById('command-menu-content')!;

    this.buildGroups(groups);
    this.setupToggle();
  }

  private buildGroups(groups: CommandGroup[]): void {
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g];

      // Group label
      const label = document.createElement('div');
      label.className = 'cmd-group-label';
      label.textContent = group.name;
      label.style.color = group.color;
      this.content.appendChild(label);

      // Buttons
      for (const cmd of group.commands) {
        const btn = document.createElement('button');
        btn.className = 'cmd-btn';
        btn.dataset.group = group.name;
        btn.textContent = cmd;
        btn.addEventListener('click', () => {
          this.onCommand(cmd);
          btn.blur();
        });
        this.content.appendChild(btn);
      }

      // Divider between groups (not after the last one)
      if (g < groups.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'cmd-divider';
        this.content.appendChild(divider);
      }
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
