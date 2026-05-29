import { OutputBuffer } from './OutputBuffer';
import { CommandParser } from './CommandParser';

export class Terminal {
  private container: HTMLElement;
  private outputBuffer: OutputBuffer;
  private commandParser: CommandParser;
  private inputElement: HTMLInputElement;
  private promptText: string;
  private commandHistory: string[];
  private historyIndex: number;
  private currentInputLine: HTMLDivElement;
  private isBooting: boolean;
  private onBootComplete: (() => void) | null = null;

  constructor(
    containerId: string,
    commandParser: CommandParser,
    promptText = 'user@portfolio:~$'
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.outputBuffer = new OutputBuffer(containerId);
    this.commandParser = commandParser;
    this.promptText = promptText;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isBooting = true;

    // Start boot sequence instead of showing prompt immediately
    this.currentInputLine = this.createHiddenInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.inputElement.disabled = true;
    this.setupInputHandling();

    this.runBootSequence();
  }

  focus(): void {
    if (!this.isBooting) {
      this.inputElement.focus();
    }
  }

  clear(): void {
    this.outputBuffer.clear();
    this.container.innerHTML = '';
    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();
  }

  writeLines(lines: string[], isError = false): void {
    this.outputBuffer.addLines(lines, isError ? 'terminal-error' : 'terminal-output');
  }

  setOnBootComplete(callback: () => void): void {
    this.onBootComplete = callback;
  }

  private async runBootSequence(): Promise<void> {
    const screenGlass = document.getElementById('screen-glass');
    if (screenGlass) {
      screenGlass.classList.add('crt-warmup');
    }

    const bootLines = [
      { text: '', delay: 300 },
      { text: 'BIOS Date: 01/15/98 14:22:51', delay: 50 },
      { text: 'CPU: Intel Pentium II 333MHz', delay: 50 },
      { text: 'Checking NVRAM... OK', delay: 100 },
      { text: '640K RAM System... OK', delay: 100 },
      { text: 'Extended Memory: 65536K', delay: 80 },
      { text: '', delay: 100 },
      { text: 'Booting from Hard Disk...', delay: 200 },
      { text: '', delay: 100 },
      { text: 'Loading Linux 2.4.20...', delay: 150 },
      { text: 'ide0: BM-DMA at 0xf000-0xf007', delay: 80 },
      { text: 'hda: QUANTUM FIREBALL, ATA DISK drive', delay: 80 },
      { text: 'hda: 2456 MB, CHS=623/128/63', delay: 80 },
      { text: 'ide1: BM-DMA at 0xf008-0xf00f', delay: 80 },
      { text: 'hdc: CD-ROM, ATAPI CD/DVD-ROM drive', delay: 80 },
      { text: '', delay: 100 },
      { text: 'Detecting hardware...', delay: 200 },
      { text: 'eth0: RealTek RTL8139', delay: 80 },
      { text: 'usb-uhci.c: USB Universal Host Controller Interface', delay: 80 },
      { text: '', delay: 100 },
      { text: 'Mounting filesystems...', delay: 150 },
      { text: 'Loading system services...', delay: 200 },
      { text: '', delay: 100 },
      { text: 'System ready.', delay: 100 },
      { text: '', delay: 200 },
      { text: 'Welcome to Hunter Dermott Terminal Portfolio v1.0', delay: 80 },
      { text: 'Type "help" for available commands.', delay: 0 },
      { text: '', delay: 0 },
    ];

    for (const line of bootLines) {
      await this.delay(line.delay);
      if (line.text) {
        this.outputBuffer.addLine(line.text, 'terminal-dim');
      }
    }

    this.isBooting = false;
    this.inputElement.disabled = false;

    // Remove old hidden input line and show real prompt
    this.currentInputLine.remove();
    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();

    if (this.onBootComplete) {
      this.onBootComplete();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createInputLine(): HTMLDivElement {
    const line = document.createElement('div');
    line.className = 'terminal-input-line';
    line.innerHTML = `
      <span class="terminal-prompt">${this.promptText}</span>&nbsp;
      <span class="terminal-input-wrapper">
        <input type="text" class="terminal-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="terminal-command" id="terminal-input-${Date.now()}">
      </span>
    `;
    return line;
  }

  private createHiddenInputLine(): HTMLDivElement {
    const line = document.createElement('div');
    line.className = 'terminal-input-line';
    line.style.opacity = '0';
    line.innerHTML = `
      <span class="terminal-prompt">${this.promptText}</span>&nbsp;
      <span class="terminal-input-wrapper">
        <input type="text" class="terminal-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore name="terminal-command" id="terminal-input-boot" disabled>
      </span>
    `;
    return line;
  }

  private setupInputHandling(): void {
    this.inputElement.addEventListener('keydown', (e) => {
      if (this.isBooting) return;

      if (e.key === 'Enter') {
        this.handleCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
      }
    });

    this.container.addEventListener('click', () => {
      if (!this.isBooting) {
        this.inputElement.focus();
      }
    });
  }

  private handleCommand(): void {
    if (this.isBooting) return;

    const input = this.inputElement.value;
    if (!input.trim()) {
      this.newPrompt();
      return;
    }

    this.outputBuffer.addLine(`${this.promptText} ${input}`, 'terminal-output');

    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;

    const result = this.commandParser.parse(input);
    if (result.clear) {
      this.clear();
      return;
    } else if (result.lines.length > 0) {
      this.outputBuffer.addLines(result.lines, result.error ? 'terminal-error' : 'terminal-output');
    }

    this.newPrompt();
  }

  private newPrompt(): void {
    const oldLine = this.currentInputLine;
    oldLine.remove();

    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.inputElement.value = '';
      return;
    }

    this.inputElement.value = this.commandHistory[this.historyIndex];
  }
}
