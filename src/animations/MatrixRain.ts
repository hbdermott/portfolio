export class MatrixRain {
  private container: HTMLElement;
  private active: boolean;
  private columns: HTMLDivElement[];
  private chars: string;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.active = false;
    this.columns = [];
    this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    const overlay = document.createElement('div');
    overlay.className = 'matrix-overlay';
    overlay.id = 'matrix-overlay';
    this.container.appendChild(overlay);

    const width = this.container.clientWidth;
    const colWidth = 14;
    const numCols = Math.floor(width / colWidth);

    for (let i = 0; i < numCols; i++) {
      const col = document.createElement('div');
      col.className = 'matrix-column';
      col.style.left = `${i * colWidth}px`;
      col.style.animationDuration = `${Math.random() * 3 + 2}s`;
      overlay.appendChild(col);
      this.columns.push(col);
      this.animateColumn(col);
    }

    setTimeout(() => {
      this.stop();
    }, 8000);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    const overlay = document.getElementById('matrix-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.columns = [];
  }

  private animateColumn(col: HTMLDivElement): void {
    if (!this.active) return;

    const chars = this.chars;
    let text = '';
    const length = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < length; i++) {
      text += chars[Math.floor(Math.random() * chars.length)] + '\n';
    }

    col.textContent = text;
    col.style.top = '-100px';

    const duration = Math.random() * 4000 + 2000;
    col.style.transition = `top ${duration}ms linear`;

    col.offsetHeight;

    col.style.top = `${this.container.clientHeight + 100}px`;

    setTimeout(() => {
      if (this.active) {
        this.animateColumn(col);
      }
    }, duration);
  }
}
