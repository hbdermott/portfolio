/**
 * Responsive command menu overlay with grouped, color-coded commands.
 *
 * Dropdown panels use `position: fixed` with coordinates computed from
 * the reference button’s viewport rect.  They close automatically when
 * the scrollable command-menu-content is scrolled or the window is resized.
 * This is the standard Popper / Floating UI pattern for dropdowns inside
 * overflow containers.
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

      const label = document.createElement('div');
      label.className = 'cmd-group-label';
      label.textContent = group.name;
      label.style.color = group.color;
      this.content.appendChild(label);

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
          document.body.appendChild(panel);

          for (const flag of flags) {
            const flagBtn = document.createElement('button');
            flagBtn.className = 'cmd-dropdown-item';
            flagBtn.textContent = flag;
            flagBtn.addEventListener('click', () => {
              this.onCommand(`${name} ${flag}`);
              this.hidePanel(panel, arrow);
              flagBtn.blur();
            });
            panel.appendChild(flagBtn);
          }

          arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = panel.classList.contains('open');
            this.closeAllPanels();
            if (!wasOpen) {
              this.showPanel(panel, wrapper, arrow);
            }
            arrow.blur();
          });

          wrapper.appendChild(arrow);
        }

        this.content.appendChild(wrapper);
      }

      if (g < groups.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'cmd-divider';
        this.content.appendChild(divider);
      }
    }

    // Close on click outside
    document.addEventListener('click', () => this.closeAllPanels());

    // Close on scroll of the command menu (prevents stuck panels)
    this.content.addEventListener('scroll', () => this.closeAllPanels(), { passive: true });

    // Close on window resize
    window.addEventListener('resize', () => this.closeAllPanels());
  }

  private showPanel(panel: HTMLElement, wrapper: HTMLElement, arrow: HTMLElement): void {
    const rect = wrapper.getBoundingClientRect();
    const gap = 6;

    // Measure true height: briefly render off-screen
    panel.style.visibility = 'hidden';
    panel.classList.add('open');
    const panelHeight = panel.offsetHeight;
    panel.classList.remove('open');
    panel.style.visibility = '';

    // Open upward with a gap so the button stays fully visible
    let top = rect.top - panelHeight - gap;

    // If there's no room above, open below
    if (top < 4) {
      top = rect.bottom + gap;
    }

    panel.style.left = `${rect.left}px`;
    panel.style.top = `${top}px`;
    panel.classList.add('open');
    arrow.textContent = '▴';
  }

  private hidePanel(panel: HTMLElement, arrow: HTMLElement): void {
    panel.classList.remove('open');
    arrow.textContent = '▾';
  }

  private closeAllPanels(): void {
    document.querySelectorAll('.cmd-dropdown-panel.open').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.cmd-dropdown-arrow').forEach(a => { a.textContent = '▾'; });
  }

  private setupToggle(): void {
    this.toggle.addEventListener('click', () => {
      this.minimized = !this.minimized;
      this.container.classList.toggle('minimized', this.minimized);
      this.toggle.textContent = this.minimized ? 'Commands ▲' : 'Commands ▼';
    });
  }
}
