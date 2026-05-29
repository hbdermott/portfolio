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

  // Layout constants — high resolution for crisp projection-mapped text
  private readonly width = 1024;
  private readonly height = 768;
  private readonly fontSize = 16;
  private readonly lineHeight = 20;
  private readonly padding = 24;
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
      this.render(time);
      this.texture.needsUpdate = true;
      this.dirty = false;
    }
  }

  private render(time: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    // ─── Terminal content ───
    this.renderContent(ctx);

    // ─── CRT post-processing effects ───
    this.applyVignette(ctx, w, h);
    this.applyScanlines(ctx, w, h);
    this.applyApertureGrille(ctx, w, h);
    this.applyNoise(ctx, w, h, time);
    this.applyFlicker(ctx, w, h, time);
  }

  private renderContent(ctx: CanvasRenderingContext2D): void {
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
      ctx.shadowBlur = 6;
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
      ctx.shadowBlur = 6;
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
            ctx.shadowBlur = 6;
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
  }

  /**
   * Vignette: darkens corners to simulate CRT tube curvature and light falloff.
   */
  private applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.85);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Scanlines: horizontal black lines with slight brightness variation (interlacing).
   */
  private applyScanlines(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.globalCompositeOperation = 'source-over';

    // Primary scanlines: every 3rd pixel, 1px thick, fairly dark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Secondary "interlace" lines: every other primary line is slightly brighter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 1; y < h; y += 6) {
      ctx.fillRect(0, y, w, 1);
    }

    // Horizontal glow bleed between lines (subtle green tint in gaps)
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(51, 255, 51, 0.015)';
    for (let y = 2; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Aperture grille / shadow mask: vertical RGB stripes simulating CRT phosphor triads.
   */
  private applyApertureGrille(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.globalCompositeOperation = 'overlay';
    const stripeWidth = 3; // 1px R + 1px G + 1px B
    for (let x = 0; x < w; x += stripeWidth) {
      // Red stripe
      ctx.fillStyle = 'rgba(255, 0, 0, 0.035)';
      ctx.fillRect(x, 0, 1, h);
      // Green stripe
      ctx.fillStyle = 'rgba(0, 255, 0, 0.045)';
      ctx.fillRect(x + 1, 0, 1, h);
      // Blue stripe
      ctx.fillStyle = 'rgba(0, 0, 255, 0.035)';
      ctx.fillRect(x + 2, 0, 1, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Analog noise: sparse random green-tinted pixels.
   */
  private applyNoise(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // Seeded-ish random from time so noise shimmers each frame
    const seed = Math.floor(time / 80);
    const noiseCount = 600; // number of noise specks
    ctx.fillStyle = 'rgba(51, 255, 51, 0.12)';

    for (let i = 0; i < noiseCount; i++) {
      const px = Math.floor(Math.abs(Math.sin(i * 12.9898 + seed * 78.233) * w));
      const py = Math.floor(Math.abs(Math.cos(i * 43.123 + seed * 37.719) * h));
      ctx.fillRect(px, py, 1, 1);
    }
  }

  /**
   * Flicker: very subtle whole-screen brightness modulation + occasional roll bar.
   */
  private applyFlicker(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    // Slow brightness pulse (mains hum ~50/60Hz feel)
    const flicker = 0.5 + 0.5 * Math.sin(time * 0.004);
    const alpha = 0.02 + flicker * 0.02; // 0.02–0.04 range
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, w, h);

    // Occasional horizontal "roll bar" — a faint dark band sweeping down
    const rollPos = (time * 0.08) % (h * 1.5);
    if (rollPos < h) {
      const grad = ctx.createLinearGradient(0, rollPos - 10, 0, rollPos + 10);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, rollPos - 10, w, 20);
    }
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
