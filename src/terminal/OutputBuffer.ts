export class OutputBuffer {
  private container: HTMLElement;
  private maxLines: number;

  constructor(containerId: string, maxLines = 1000) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.maxLines = maxLines;
  }

  addLine(text: string, className = 'terminal-output'): void {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    this.container.appendChild(line);
    this.trimOldLines();
    this.scrollToBottom();
  }

  addLines(lines: string[], className = 'terminal-output'): void {
    const fragment = document.createDocumentFragment();
    for (const text of lines) {
      const line = document.createElement('div');
      line.className = `terminal-line ${className}`;
      line.textContent = text;
      fragment.appendChild(line);
    }
    this.container.appendChild(fragment);
    this.trimOldLines();
    this.scrollToBottom();
  }

  clear(): void {
    this.container.innerHTML = '';
  }

  private trimOldLines(): void {
    const lines = this.container.querySelectorAll('.terminal-line');
    if (lines.length > this.maxLines) {
      for (let i = 0; i < lines.length - this.maxLines; i++) {
        lines[i].remove();
      }
    }
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
