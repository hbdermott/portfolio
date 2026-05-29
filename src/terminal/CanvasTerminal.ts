import * as THREE from 'three';
import type { CommandParser } from './CommandParser';

interface TerminalLine {
  text: string;
  type: 'output' | 'error' | 'dim' | 'prompt';
}

export class CanvasTerminal {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private commandParser: CommandParser;

  private promptText = 'user@portfolio:~$';
  private lines: TerminalLine[] = [];
  private inputBuffer = '';
  private commandHistory: string[] = [];
  private historyIndex = -1;

  private cursorVisible = true;
  private lastBlinkTime = 0;
  private blinkInterval = 530; // ms

  private booting = true;
  private dirty = true;

  // Layout constants - sized to fit the 3D monitor screen
  private readonly width = 320*3;
  private readonly height = 240*3;
  private readonly fontSize = 7;
  private readonly lineHeight = 9;
  private readonly padding = 10;
  private readonly textColor = '#33ff33';
  private readonly dimColor = '#1a8a1a';
  private readonly errorColor = '#ff3333';
  private readonly bgColor = '#000000';

  private charWidth = 9.6; // approximate, measured later
  private maxVisibleLines = 0;
  private scrollOffset = 0;

  constructor(commandParser: CommandParser) {
    this.commandParser = commandParser;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    // Measure character width
    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.charWidth = this.ctx.measureText('M').width;
    this.maxVisibleLines = Math.floor((this.height - this.padding * 2) / this.lineHeight);

    this.setupKeyboard();
    this.runBootSequence();
  }

  getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  clearDirty(): void {
    this.dirty = false;
  }

  update(time: number): void {
    // Cursor blink
    if (time - this.lastBlinkTime > this.blinkInterval) {
      this.cursorVisible = !this.cursorVisible;
      this.lastBlinkTime = time;
      this.dirty = true;
    }

    if (this.dirty) {
      this.render();
      this.texture.needsUpdate = true;
      this.dirty = false;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Calculate visible line range
    const totalLines = this.lines.length + 1; // +1 for input line
    let startLine = Math.max(0, totalLines - this.maxVisibleLines);
    if (this.scrollOffset > 0) {
      startLine = Math.max(0, Math.min(startLine + this.scrollOffset, totalLines - this.maxVisibleLines));
    }

    ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    ctx.textBaseline = 'top';

    let y = this.padding;

    // Draw output lines
    for (let i = startLine; i < this.lines.length && i < startLine + this.maxVisibleLines; i++) {
      const line = this.lines[i];
      ctx.fillStyle = this.getColorForType(line.type);
      // Apply phosphor glow effect
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 4;
      ctx.fillText(line.text, this.padding, y);
      ctx.shadowBlur = 0;
      y += this.lineHeight;
    }

    // Draw input line with block cursor
    if (!this.booting && this.lines.length - startLine < this.maxVisibleLines) {
      const promptWidth = this.ctx.measureText(this.promptText + ' ').width;

      // Draw prompt
      ctx.fillStyle = this.textColor;
      ctx.shadowColor = this.textColor;
      ctx.shadowBlur = 4;
      ctx.fillText(this.promptText + ' ', this.padding, y);
      ctx.shadowBlur = 0;

      // Draw input text
      const inputX = this.padding + promptWidth;

      if (this.cursorVisible && this.inputBuffer.length === 0) {
        // Empty line with cursor - draw filled block
        ctx.fillStyle = this.textColor;
        ctx.fillRect(inputX, y, this.charWidth, this.lineHeight);
      } else {
        // Draw text with cursor block
        for (let i = 0; i < this.inputBuffer.length; i++) {
          const char = this.inputBuffer[i];
          const charX = inputX + i * this.charWidth;

          if (this.cursorVisible && i === this.inputBuffer.length - 1) {
            // Last char with cursor
            ctx.fillStyle = this.textColor;
            ctx.fillRect(charX, y, this.charWidth, this.lineHeight);
            ctx.fillStyle = this.bgColor;
            ctx.fillText(char, charX, y);
          } else {
            ctx.fillStyle = this.textColor;
            ctx.shadowColor = this.textColor;
            ctx.shadowBlur = 4;
            ctx.fillText(char, charX, y);
            ctx.shadowBlur = 0;
          }
        }

        // Cursor at end of text (after last char)
        if (this.cursorVisible) {
          const cursorX = inputX + this.inputBuffer.length * this.charWidth;
          ctx.fillStyle = this.textColor;
          ctx.fillRect(cursorX, y, this.charWidth, this.lineHeight);
        }
      }
    }

    // Apply scanline overlay
    this.drawScanlines(ctx, w, h);
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Subtle horizontal RGB stripes (aperture grille simulation)
    ctx.globalCompositeOperation = 'overlay';
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.02)';
      ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.03)';
      ctx.fillRect(0, y + 1, w, 1);
      ctx.fillStyle = 'rgba(0, 0, 255, 0.02)';
      ctx.fillRect(0, y + 2, w, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private getColorForType(type: string): string {
    switch (type) {
      case 'error': return this.errorColor;
      case 'dim': return this.dimColor;
      default: return this.textColor;
    }
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (this.booting) return;

      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      if (e.key === 'Enter') {
        this.executeCommand();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.inputBuffer = this.inputBuffer.slice(0, -1);
        this.dirty = true;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Printable character
        this.inputBuffer += e.key;
        this.dirty = true;
      }
    });
  }

  private executeCommand(): void {
    const input = this.inputBuffer.trim();
    if (!input) {
      this.inputBuffer = '';
      this.dirty = true;
      return;
    }

    // Add prompt line to history
    this.lines.push({ text: `${this.promptText} ${input}`, type: 'prompt' });

    // Execute command
    const result = this.commandParser.parse(input);

    if (result.clear) {
      this.lines = [];
    } else {
      const type = result.error ? 'error' : 'output';
      for (const line of result.lines) {
        this.lines.push({ text: line, type });
      }
    }

    // Add to history
    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;
    this.inputBuffer = '';
    this.dirty = true;
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.inputBuffer = '';
      this.dirty = true;
      return;
    }

    this.inputBuffer = this.commandHistory[this.historyIndex];
    this.dirty = true;
  }

  private async runBootSequence(): Promise<void> {
    const bootLines: { text: string; type: TerminalLine['type']; delay: number }[] = [
      { text: 'BIOS Date: 01/15/98 14:22:51 Ver 1.02', type: 'dim', delay: 300 },
      { text: 'CPU: Intel Pentium II 333MHz', type: 'dim', delay: 80 },
      { text: 'Speed: 333 MHz', type: 'dim', delay: 60 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Checking NVRAM......', type: 'dim', delay: 200 },
      { text: '640K RAM System...... OK', type: 'dim', delay: 100 },
      { text: 'Extended Memory: 65536K', type: 'dim', delay: 80 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Award Plug and Play BIOS Extension v1.0A', type: 'dim', delay: 100 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Detecting HDD Primary Master ...... QUANTUM FIREBALL', type: 'dim', delay: 200 },
      { text: 'Detecting HDD Primary Slave ...... None', type: 'dim', delay: 100 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Booting from Hard Disk...', type: 'dim', delay: 300 },
      { text: '', type: 'output', delay: 200 },
      { text: 'Loading Linux 2.4.20-8...', type: 'dim', delay: 200 },
      { text: 'ide0: BM-DMA at 0xf000-0xf007, BIOS settings: hda:DMA, hdb:pio', type: 'dim', delay: 80 },
      { text: 'hda: QUANTUM FIREBALL, ATA DISK drive', type: 'dim', delay: 80 },
      { text: 'hda: 245664 MB, CHS=623/128/63', type: 'dim', delay: 80 },
      { text: 'ide1: BM-DMA at 0xf008-0xf00f, BIOS settings: hdc:DMA, hdd:pio', type: 'dim', delay: 80 },
      { text: 'hdc: SONY CD-ROM CDU, ATAPI CD/DVD-ROM drive', type: 'dim', delay: 80 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Partition check:', type: 'dim', delay: 100 },
      { text: ' hda: hda1 hda2 < hda5 hda6 >', type: 'dim', delay: 100 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Mounting local filesystems...', type: 'dim', delay: 200 },
      { text: 'Setting hostname portfolio...', type: 'dim', delay: 100 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Initializing random number generator...', type: 'dim', delay: 150 },
      { text: 'Starting system logger...', type: 'dim', delay: 100 },
      { text: 'Starting kernel logger...', type: 'dim', delay: 100 },
      { text: 'Starting internet superserver...', type: 'dim', delay: 100 },
      { text: '', type: 'output', delay: 200 },
      { text: 'System ready.', type: 'output', delay: 100 },
      { text: '', type: 'output', delay: 100 },
      { text: 'Welcome to Hunter Dermott Terminal Portfolio v1.0', type: 'output', delay: 100 },
      { text: 'Type "help" for available commands.', type: 'dim', delay: 0 },
      { text: '', type: 'output', delay: 0 },
    ];

    for (const line of bootLines) {
      await this.delay(line.delay);
      this.lines.push({ text: line.text, type: line.type });
      this.dirty = true;
    }

    this.booting = false;
    this.dirty = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
