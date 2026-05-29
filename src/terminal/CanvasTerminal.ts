import * as THREE from 'three';
import type { CommandParser } from './CommandParser';
import { KeyboardSound } from '../audio/KeyboardSound';
import { MatrixRain } from '../animations/MatrixRain';
import { GlitchEffect } from '../animations/GlitchEffect';
import { SnakeGame } from '../games/SnakeGame';

interface TerminalLine {
  text: string;
  type: 'output' | 'error' | 'dim' | 'prompt';
}

type TerminalMode = 'terminal' | 'matrix' | 'snake';

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

  // Layout constants
  private readonly width = 1024;
  private readonly height = 768;
  private readonly fontSize = 16;
  private readonly lineHeight = 20;
  private readonly padding = 24;
  private readonly textColor = '#33ff33';
  private readonly dimColor = '#1a8a1a';
  private readonly errorColor = '#ff3333';
  private readonly bgColor = '#444444';

  // CRT effect scalers (0.0 = off, 1.0 = full)
  private readonly VIGNETTE_STRENGTH   = 0.6;
  private readonly SCANLINE_STRENGTH   = 0.7;
  private readonly APERTURE_STRENGTH   = 0.3;
  private readonly CHROMATIC_STRENGTH = 1.5;
  private readonly NOISE_STRENGTH      = 1;
  private readonly FLICKER_STRENGTH    = 0.3;

  // Performance: only apply chromatic aberration every N frames
  private chromaticFrameCounter = 0;
  private readonly CHROMATIC_FRAME_SKIP = 2; // run every 3rd frame

  private charWidth = 9.6;
  private maxVisibleLines = 0;
  private scrollOffset = 0;
  private promptWidth = 0;
  private keyboardSound = new KeyboardSound('/keyboard.mp3');

  // ─── Modes & effects ───
  private mode: TerminalMode = 'terminal';
  private matrixRain = new MatrixRain();
  private glitch = new GlitchEffect();
  private snakeGame = new SnakeGame(() => this.exitSnake());
  private lastActivity = 0;
  private readonly IDLE_MS = 30000; // 30s screensaver timeout

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

    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.charWidth = this.ctx.measureText('M').width;
    this.promptWidth = this.ctx.measureText(this.promptText + ' ').width;
    this.maxVisibleLines = Math.floor((this.height - this.padding * 2) / this.lineHeight);

    this.setupKeyboard();
    this.setupTapFocus();
    this.runBootSequence();
    this.keyboardSound.load();
  }

  // ─── Public API ───

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

  /** Inject a command as if the user typed it. */
  injectCommand(cmd: string): void {
    if (this.mode !== 'terminal') return;
    this.inputBuffer = cmd;
    this.dirty = true;
    this.executeCommand();
  }

  /** Focus hidden input to summon mobile keyboard. */
  focusInput(): void {
    const input = document.getElementById('terminal-input-capture') as HTMLInputElement;
    if (input) input.focus();
  }

  /** Start Matrix Rain screensaver immediately. */
  startMatrixRain(): void {
    this.mode = 'matrix';
    this.matrixRain.start(this.width, this.height);
    this.dirty = true;
  }

  /** Stop screensaver and return to terminal. */
  stopMatrixRain(): void {
    this.matrixRain.stop();
    this.mode = 'terminal';
    this.dirty = true;
  }

  /** Trigger a glitch burst. */
  triggerGlitch(): void {
    this.glitch.trigger();
    this.dirty = true;
  }

  /** Launch Snake game. */
  startSnake(): void {
    this.mode = 'snake';
    this.snakeGame.start(50, 36);
    this.dirty = true;
  }

  /** Exit Snake and return to terminal. */
  private exitSnake(): void {
    this.snakeGame.stop();
    this.mode = 'terminal';
    this.dirty = true;
  }

  // ─── Main Loop ───

  update(time: number): void {
    this.glitch.update();

    // Cursor blink (terminal only)
    if (this.mode === 'terminal' && !this.booting) {
      if (time - this.lastBlinkTime > this.blinkInterval) {
        this.cursorVisible = !this.cursorVisible;
        this.lastBlinkTime = time;
        this.dirty = true;
      }
    }

    // Snake game tick
    if (this.mode === 'snake') {
      this.snakeGame.update(time);
      this.dirty = true;
    }

    // Auto-start screensaver after idle
    if (this.mode === 'terminal' && !this.booting && time - this.lastActivity > this.IDLE_MS) {
      this.startMatrixRain();
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

    if (this.mode === 'matrix') {
      this.matrixRain.render(ctx, w, h);
    } else if (this.mode === 'snake') {
      this.snakeGame.render(ctx, w, h);
    } else {
      // Terminal mode
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      this.renderContent(ctx);
    }

    // Glitch overlay (applies to any mode)
    if (this.glitch.isActive()) {
      this.renderGlitch(ctx, w, h);
    }

    // CRT effects (skip expensive ones in matrix / snake)
    if (this.mode === 'matrix') {
      this.applyScanlines(ctx, w, h);
      this.applyFlicker(ctx, w, h, time);
    } else if (this.mode !== 'snake') {
      this.applyVignette(ctx, w, h);
      this.applyScanlines(ctx, w, h);
      this.applyApertureGrille(ctx, w, h);
      // Chromatic aberration is expensive; skip frames to save ~67% cost.
      if (++this.chromaticFrameCounter > this.CHROMATIC_FRAME_SKIP) {
        this.chromaticFrameCounter = 0;
        this.applyChromaticAbberation(ctx, w, h);
      }
      this.applyNoise(ctx, w, h, time);
      this.applyFlicker(ctx, w, h, time);
    }
  }

  private renderGlitch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const intensity = this.glitch.getIntensity();
    // Heavy noise burst
    const count = Math.floor(2000 * intensity);
    ctx.fillStyle = `rgba(51, 255, 51, ${0.3 * intensity})`;
    for (let i = 0; i < count; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 4 + 1, 1);
    }
    // RGB split bands
    for (let i = 0; i < 5 * intensity; i++) {
      const y = Math.random() * h;
      const shift = (Math.random() - 0.5) * 20 * intensity;
      ctx.drawImage(this.canvas, 0, y, w, 2, shift, y, w, 2);
    }
  }

  private renderContent(ctx: CanvasRenderingContext2D): void {
    const totalLines = this.lines.length + 1;
    let startLine = Math.max(0, totalLines - this.maxVisibleLines);
    if (this.scrollOffset > 0) {
      startLine = Math.max(0, Math.min(startLine + this.scrollOffset, totalLines - this.maxVisibleLines));
    }

    ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    ctx.textBaseline = 'top';

    let y = this.padding;

    for (let i = startLine; i < this.lines.length && i < startLine + this.maxVisibleLines; i++) {
      this.drawTextWithGlow(ctx, this.lines[i].text, this.padding, y, this.getColorForType(this.lines[i].type));
      y += this.lineHeight;
    }

    if (!this.booting && this.lines.length - startLine < this.maxVisibleLines) {
      this.drawTextWithGlow(ctx, this.promptText + ' ', this.padding, y, this.textColor);
      this.renderInputLine(ctx, this.padding + this.promptWidth, y);
    }
  }

  private drawTextWithGlow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  }

  private renderInputLine(ctx: CanvasRenderingContext2D, inputX: number, y: number): void {
    const buf = this.inputBuffer;
    const len = buf.length;

    // Draw every character normally.
    for (let i = 0; i < len; i++) {
      const charX = inputX + i * this.charWidth;
      this.drawTextWithGlow(ctx, buf[i], charX, y, this.textColor);
    }

    // Single cursor block right after the last character (or at the start if empty).
    if (this.cursorVisible) {
      const cursorX = inputX + len * this.charWidth;
      ctx.fillStyle = this.textColor;
      ctx.fillRect(cursorX, y, this.charWidth, this.lineHeight);
    }
  }

  // ─── Input ───

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Wake from screensaver on any key
      if (this.mode === 'matrix') {
        this.stopMatrixRain();
        this.lastActivity = performance.now();
        return;
      }

      // Snake game input (no typing sounds during game)
      if (this.mode === 'snake') {
        this.lastActivity = performance.now();
        // Ctrl+C quits snake
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
          this.exitSnake();
          return;
        }
        this.snakeGame.handleKey(e.key);
        return;
      }

      if (this.booting) return;
      this.lastActivity = performance.now();

      // Ctrl+C interrupts current input, prints ^C, and returns to prompt
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (this.inputBuffer.length > 0) {
          this.lines.push({ text: `${this.promptText} ${this.inputBuffer}^C`, type: 'prompt' });
        } else {
          this.lines.push({ text: '^C', type: 'output' });
        }
        this.inputBuffer = '';
        this.dirty = true;
        this.keyboardSound.play();
        return;
      }

      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      this.keyboardSound.play();

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
        this.inputBuffer += e.key;
        this.dirty = true;
      }
    });
  }

  private setupTapFocus(): void {
    // Tap anywhere on the 3D canvas to summon mobile keyboard
    const container = document.getElementById('canvas-container');
    if (container) {
      container.addEventListener('touchstart', () => this.focusInput(), { passive: true });
      container.addEventListener('click', () => this.focusInput());
    }
  }

  private executeCommand(): void {
    const input = this.inputBuffer.trim();
    if (!input) {
      this.inputBuffer = '';
      this.dirty = true;
      return;
    }

    this.lines.push({ text: `${this.promptText} ${input}`, type: 'prompt' });
    const result = this.commandParser.parse(input);

    if (result.clear) {
      this.lines = [];
    } else {
      const type = result.error ? 'error' : 'output';
      for (const line of result.lines) {
        this.lines.push({ text: line, type });
      }
    }

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

  private getColorForType(type: string): string {
    switch (type) {
      case 'error': return this.errorColor;
      case 'dim': return this.dimColor;
      default: return this.textColor;
    }
  }

  // ─── CRT Effects ───

  private applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = this.VIGNETTE_STRENGTH;
    if (s <= 0) return;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.9);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, `rgba(0, 0, 0, ${0.35 * s})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.85 * s})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  private applyScanlines(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = this.SCANLINE_STRENGTH;
    if (s <= 0) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * s})`;
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 * s})`;
    for (let y = 1; y < h; y += 6) ctx.fillRect(0, y, w, 1);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(51, 255, 51, ${0.04 * s})`;
    for (let y = 2; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalCompositeOperation = 'source-over';
  }

  private applyApertureGrille(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = this.APERTURE_STRENGTH;
    if (s <= 0) return;
    ctx.globalCompositeOperation = 'overlay';
    for (let x = 0; x < w; x += 3) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.18 * s})`;
      ctx.fillRect(x, 0, 1, h);
      ctx.fillStyle = `rgba(0, 255, 0, ${0.22 * s})`;
      ctx.fillRect(x + 1, 0, 1, h);
      ctx.fillStyle = `rgba(0, 0, 255, ${0.18 * s})`;
      ctx.fillRect(x + 2, 0, 1, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private applyChromaticAbberation(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = this.CHROMATIC_STRENGTH;
    if (s <= 0) return;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const offset = Math.round(3 * s);
    const halfW = w / 2;
    const halfH = h / 2;
    const invHalfW = 1 / halfW;
    const invHalfH = 1 / halfH;

    for (let y = 0; y < h; y++) {
      const dy = (y - halfH) * invHalfH;
      const dy2 = dy * dy;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dx = (x - halfW) * invHalfW;
        const strength = Math.sqrt(dx * dx + dy2) * 0.6 * s;
        if (strength > 0.05) {
          const shift = Math.round(offset * strength);
          const rx = x + shift;
          if (rx < w) data[i] = data[(y * w + rx) * 4];
          const bx = x - shift;
          if (bx >= 0) data[i + 2] = data[(y * w + bx) * 4 + 2];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private applyNoise(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const s = this.NOISE_STRENGTH;
    if (s <= 0) return;
    const seed = Math.floor(time / 80);
    const noiseCount = Math.round(1200 * s);
    const margin = 4;
    const boundW = w - margin * 2;
    const boundH = h - margin * 2;
    for (let i = 0; i < noiseCount; i++) {
      const hash = Math.abs(Math.sin(i * 12.9898 + seed * 78.233));
      const px = margin + Math.floor(Math.random() * boundW);
      const py = margin + Math.floor(Math.random() * boundH);
      ctx.fillStyle = hash > 0.4
        ? `rgba(200, 255, 200, ${0.22 * s})`
        : `rgba(0, 0, 0, ${0.18 * s})`;
      ctx.fillRect(px, py, 1, 1);
    }
  }

  private applyFlicker(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const s = this.FLICKER_STRENGTH;
    if (s <= 0) return;
    const flicker = 0.5 + 0.5 * Math.sin(time * 0.05);
    const alpha = (0.02 + flicker * 0.04) * s;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, w, h);
    const rollPos = (time * 1.5) % (h * 1.5);
    if (rollPos < h) {
      const grad = ctx.createLinearGradient(0, rollPos - 12, 0, rollPos + 12);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, `rgba(0,0,0,${0.12 * s})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, rollPos - 12, w, 24);
    }
  }

  // ─── Boot ───

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
    this.lastActivity = performance.now();
    this.dirty = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
