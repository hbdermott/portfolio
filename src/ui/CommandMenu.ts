/**
 * Responsive command menu overlay with grouped, color-coded commands.
 *
 * Commands can have optional flag dropdowns (e.g. contact --mail).
 */
export interface CommandItem {
  name: string;
  flags?: string[];
}

export interface CommandGroup {
  name: string;
  color: string;
  commands: (string | CommandItem)[];
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

      // Buttons (some may have dropdowns)
      for (const item of group.commands) {
        const isString = typeof item === 'string';
        const name = isString ? item : item.name;
        const flags = isString ? undefined : item.flags;

        const wrapper = document.createElement('div');
        wrapper.className = 'cmd-btn-wrapper';
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '0';

        // Main command button
        const btn = document.createElement('button');
        btn.className = 'cmd-btn';
        btn.dataset.group = group.name;
        btn.textContent = name;
        btn.addEventListener('click', () => {
          this.onCommand(name);
          btn.blur();
        });
        wrapper.appendChild(btn);

        // Dropdown arrow + panel for flagged commands
        if (flags && flags.length > 0) {
          const arrow = document.createElement('button');
          arrow.className = 'cmd-dropdown-arrow';
          arrow.textContent = '▾';
          arrow.title = 'Show flags';

          const panel = document.createElement('div');
          panel.className = 'cmd-dropdown-panel';

          for (const flag of flags) {
            const flagBtn = document.createElement('button');
            flagBtn.className = 'cmd-dropdown-item';
            flagBtn.textContent = flag;
            flagBtn.addEventListener('click', () => {
              this.onCommand(`${name} ${flag}`);
              panel.classList.remove('open');
              flagBtn.blur();
            });
            panel.appendChild(flagBtn);
          }

          arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.contains('open');
            // Close all other panels + arrows first
            document.querySelectorAll('.cmd-dropdown-panel.open').forEach(p => p.classList.remove('open'));
            document.querySelectorAll('.cmd-dropdown-arrow.open').forEach(a => a.classList.remove('open'));
            if (!isOpen) {
              panel.classList.add('open');
              arrow.classList.add('open');
            }
            arrow.blur();
          });

          wrapper.appendChild(arrow);
          wrapper.appendChild(panel);
        }

        this.content.appendChild(wrapper);
      }

      // Divider between groups (not after the last one)
      if (g < groups.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'cmd-divider';
        this.content.appendChild(divider);
      }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.cmd-dropdown-panel.open').forEach(p => p.classList.remove('open'));
      document.querySelectorAll('.cmd-dropdown-arrow.open').forEach(a => a.classList.remove('open'));
    });
  }

  private setupToggle(): void {
    this.toggle.addEventListener('click', () => {
      this.minimized = !this.minimized;
      this.container.classList.toggle('minimized', this.minimized);
      this.toggle.textContent = this.minimized ? 'Commands ▲' : 'Commands ▼';
    });
  }
}
