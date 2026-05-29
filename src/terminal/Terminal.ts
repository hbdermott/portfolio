import { OutputBuffer } from './OutputBuffer';
import { CommandParser } from './CommandParser';
import type { CommandResult } from '../types';

export class Terminal {
  private container: HTMLElement;
  private outputBuffer: OutputBuffer;
  private commandParser: CommandParser;
  private inputElement: HTMLInputElement;
  private promptText: string;
  private commandHistory: string[];
  private historyIndex: number;
  private currentInputLine: HTMLDivElement;

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

    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();

    this.outputBuffer.addLine('Hunter Dermott - Terminal Portfolio', 'terminal-output');
    this.outputBuffer.addLine('Type "help" for available commands.', 'terminal-dim');
    this.outputBuffer.addLine('', 'terminal-output');
  }

  focus(): void {
    this.inputElement.focus();
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

  private createInputLine(): HTMLDivElement {
    const line = document.createElement('div');
    line.className = 'terminal-input-line';
    line.innerHTML = `
      <span class="terminal-prompt">${this.promptText}</span>&nbsp;
      <input type="text" class="terminal-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <span class="cursor-blink"></span>
    `;
    return line;
  }

  private setupInputHandling(): void {
    this.inputElement.addEventListener('keydown', (e) => {
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
      this.inputElement.focus();
    });
  }

  private handleCommand(): void {
    const input = this.inputElement.value;
    if (!input.trim()) {
      this.newPrompt();
      return;
    }

    this.outputBuffer.addLine(`${this.promptText} ${input}`, 'terminal-output');

    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;

    const result = this.commandParser.parse(input);
    if (result.lines.length > 0) {
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
