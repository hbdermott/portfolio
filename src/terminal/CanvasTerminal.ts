import * as THREE from 'three';
import type { CommandParser } from './CommandParser';
import { KeyboardSound } from '../audio/KeyboardSound';
import { MatrixRain } from '../animations/MatrixRain';
import { GlitchEffect } from '../animations/GlitchEffect';
import { SnakeGame } from '../games/SnakeGame';
import { PongGame } from '../games/PongGame';

interface TerminalLine {
  text: string;
  type: 'output' | 'error' | 'dim' | 'prompt' | 'cyan' | 'yellow' | 'magenta' | 'orange' | 'white' | 'blue';
}

type TerminalMode = 'terminal' | 'matrix' | 'snake' | 'pong';

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
  private readonly cyanColor = '#33ffff';
  private readonly yellowColor = '#ffff33';
  private readonly magentaColor = '#ff33ff';
  private readonly orangeColor = '#ff9933';
  private readonly whiteColor = '#ffffff';
  private readonly blueColor = '#3388ff';
  private readonly bgColor = '#444444';

  // CRT effect scalers (0.0 = off, 1.0 = full)
  private readonly VIGNETTE_STRENGTH   = 0.6;
  private readonly SCANLINE_STRENGTH   = 0.7;
  private readonly APERTURE_STRENGTH   = 0.3;
  private readonly CHROMATIC_STRENGTH = 0.5;
  private readonly NOISE_STRENGTH      = 1;
  private readonly FLICKER_STRENGTH    = 0.3;

  // Global kill-switch for chromatic aberration (major perf cost)
  private enableChromaticGlobal = false;

  // Performance: only apply chromatic aberration every N frames
  private chromaticFrameCounter = 0;
  private readonly CHROMATIC_FRAME_SKIP = 2; // run every 3rd frame

  // Pre-rendered CRT pattern canvases (lazy-initialized)
  private aperturePattern: HTMLCanvasElement | null = null;
  private scanlinePattern: HTMLCanvasElement | null = null;

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
  private pongGame = new PongGame();
  private lastActivity = 0;
  private readonly IDLE_MS = 30000; // 30s screensaver timeout

  // ─── Shutdown animation ───
  private shutdownMode = false;
  private shutdownPending = false;
  private shutdownTime = 0;
  private readonly SHUTDOWN_SHOW_MS = 750;
  private readonly SHUTDOWN_CLOSE_MS = 125;
  private readonly SHUTDOWN_TOTAL_MS = 2500;

  constructor(commandParser: CommandParser, enableChromatic = true) {
    this.commandParser = commandParser;
    this.enableChromaticGlobal = enableChromatic;

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

  /** Inject a command as if the user typed it.
   * Interrupts any active mode (matrix / snake) and returns to terminal first. */
  injectCommand(cmd: string): void {
    this.lastActivity = performance.now();

    // Interrupt active special modes before running the command
    if (this.mode === 'matrix') {
      this.stopMatrixRain();
    } else if (this.mode === 'snake') {
      this.exitSnake();
    } else if (this.mode === 'pong') {
      this.exitPong();
    }

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
  startMatrixRain(config?: import('../animations/MatrixRain').MatrixConfig): void {
    this.mode = 'matrix';
    this.matrixRain.start(this.width, this.height, config);
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

  /** Launch Pong game. */
  startPong(): void {
    this.mode = 'pong';
    this.pongGame.start();
    this.dirty = true;
  }

  /** Exit Pong and return to terminal. */
  private exitPong(): void {
    this.pongGame.stop();
    this.mode = 'terminal';
    this.dirty = true;
  }

  // ─── Main Loop ───

  update(time: number): void {
    this.glitch.update();

    // Shutdown animation
    if (this.shutdownPending) {
      this.shutdownMode = true;
      this.shutdownTime = time;
      this.shutdownPending = false;
    }
    if (this.shutdownMode) {
      const elapsed = time - this.shutdownTime;
      if (elapsed > this.SHUTDOWN_TOTAL_MS) {
        this.shutdownMode = false;
        this.lines = [];
        this.inputBuffer = '';
      }
      this.dirty = true;
    }

    // Cursor blink (terminal only)
    if (this.mode === 'terminal' && !this.booting && !this.shutdownMode) {
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

    // Pong game tick
    if (this.mode === 'pong') {
      this.pongGame.tick();
      this.dirty = true;
    }

    // Matrix rain animates every frame
    if (this.mode === 'matrix') {
      this.dirty = true;
    }

    // Auto-start screensaver after idle
    if (this.mode === 'terminal' && !this.booting && !this.shutdownMode && time - this.lastActivity > this.IDLE_MS) {
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

    if (this.shutdownMode) {
      this.renderShutdown(ctx, w, h, time);
      return;
    }

    if (this.mode === 'matrix') {
      this.matrixRain.render(ctx, w, h);
    } else if (this.mode === 'snake') {
      this.snakeGame.render(ctx, w, h);
    } else if (this.mode === 'pong') {
      this.pongGame.render(ctx, w, h);
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

    // CRT effects — snake/pong get minimal set to avoid visual distortion
    if (this.mode === 'snake' || this.mode === 'pong') {
      this.applyScanlines(ctx, w, h);
      this.applyFlicker(ctx, w, h, time);
    } else if (this.mode === 'matrix') {
      // Matrix: per-effect config from MatrixRain
      const cfg = this.matrixRain.getConfig();
      if (cfg.enableVignette) this.applyVignette(ctx, w, h);
      if (cfg.enableScanlines) this.applyScanlines(ctx, w, h);
      if (cfg.enableAperture) this.applyApertureGrille(ctx, w, h);
      if (this.enableChromaticGlobal && cfg.enableChromatic) {
        if (++this.chromaticFrameCounter > cfg.chromaticSkip) {
          this.chromaticFrameCounter = 0;
          this.applyChromaticAbberation(ctx, w, h);
        }
      }
      if (cfg.enableNoise) this.applyNoise(ctx, w, h, time);
      if (cfg.enableFlicker) this.applyFlicker(ctx, w, h, time);
    } else {
      // Terminal: full CRT suite
      this.applyVignette(ctx, w, h);
      this.applyScanlines(ctx, w, h);
      this.applyApertureGrille(ctx, w, h);
      // Skip expensive effects during boot — invisible on dim text anyway
      const skipExpensive = this.booting;
      if (!skipExpensive) {
        // Chromatic aberration is expensive; skip frames to save ~67% cost.
        if (this.enableChromaticGlobal) {
          if (++this.chromaticFrameCounter > this.CHROMATIC_FRAME_SKIP) {
            this.chromaticFrameCounter = 0;
            this.applyChromaticAbberation(ctx, w, h);
          }
        }
        this.applyNoise(ctx, w, h, time);
      }
      this.applyFlicker(ctx, w, h, time);
    }
  }

  private renderGlitch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const intensity = this.glitch.getIntensity();

    // 1. Block displacement — copy random chunks and shift them horizontally
    const blocks = Math.floor(6 * intensity);
    for (let i = 0; i < blocks; i++) {
      const bw = Math.random() * w * 0.4 + 40;
      const bh = Math.random() * 20 + 4;
      const bx = Math.random() * (w - bw);
      const by = Math.random() * (h - bh);
      const shift = (Math.random() - 0.5) * 60 * intensity;
      ctx.drawImage(this.canvas, bx, by, bw, bh, bx + shift, by, bw, bh);
    }

    // 2. Color inversion bursts
    const inversions = Math.floor(3 * intensity);
    for (let i = 0; i < inversions; i++) {
      const iw = Math.random() * 120 + 40;
      const ih = Math.random() * 80 + 20;
      const ix = Math.random() * (w - iw);
      const iy = Math.random() * (h - ih);
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * intensity})`;
      ctx.fillRect(ix, iy, iw, ih);
      ctx.restore();
    }

    // 3. Heavy noise burst — mix of green, white, and black static
    const count = Math.floor(4000 * intensity);
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const px = Math.random() * w;
      const py = Math.random() * h;
      const pw = Math.random() * 3 + 1;
      if (r < 0.5) {
        ctx.fillStyle = `rgba(51, 255, 51, ${0.25 * intensity})`;
      } else if (r < 0.75) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * intensity})`;
      } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * intensity})`;
      }
      ctx.fillRect(px, py, pw, 1);
    }

    // 4. Thick RGB split bands (horizontal scanline disruption)
    const bands = Math.floor(8 * intensity);
    for (let i = 0; i < bands; i++) {
      const by = Math.random() * h;
      const bh = Math.random() * 8 + 2;
      const shift = (Math.random() - 0.5) * 30 * intensity;
      ctx.drawImage(this.canvas, 0, by, w, bh, shift, by, w, bh);
    }
  }

  private renderShutdown(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const elapsed = time - this.shutdownTime;

    // Phase 1: show content (first 900ms) — no flicker, just a calm pause
    if (elapsed < this.SHUTDOWN_SHOW_MS) {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      this.renderContent(ctx);
      return;
    }

    // Phase 2: black bars close from top and bottom
    const closeElapsed = elapsed - this.SHUTDOWN_SHOW_MS;
    if (closeElapsed < this.SHUTDOWN_CLOSE_MS) {
      const p = closeElapsed / this.SHUTDOWN_CLOSE_MS;
      const barH = (h / 2) * p;

      // Draw terminal content first
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
      this.renderContent(ctx);

      // Top and bottom collapsing black bars
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, barH);           // top bar growing down
      ctx.fillRect(0, h - barH, w, barH);    // bottom bar growing up

      // Subtle scanlines over the black bars (dark gray so they're visible)
      ctx.fillStyle = 'rgba(30, 30, 30, 0.4)';
      for (let y = 0; y < h; y += 2) {
        ctx.fillRect(0, y, w, 1);
      }

      // White horizontal flash line when bars nearly meet
      const gap = h - barH * 2;
      if (gap < 8 && gap > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillRect(0, h / 2 - 1, w, 2);
        ctx.shadowBlur = 0;
      }

      // Slight horizontal squeeze as bars meet
      const squeeze = 1.0 - p * 0.08;
      if (squeeze < 1.0) {
        ctx.drawImage(this.canvas, 0, 0, w, h,
          w * (1 - squeeze) * 0.5, h * (1 - squeeze) * 0.5,
          w * squeeze, h * squeeze);
      }
      return;
    }

    // Phase 3: black screen + faint "NO SIGNAL" after a pause
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    if (elapsed > this.SHUTDOWN_SHOW_MS + this.SHUTDOWN_CLOSE_MS + 400) {
      ctx.fillStyle = '#222222';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO SIGNAL', w / 2, h / 2);
      ctx.textAlign = 'left';
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
      // Ignore input during shutdown
      if (this.shutdownMode || this.shutdownPending) return;

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

      // Pong game input
      if (this.mode === 'pong') {
        this.lastActivity = performance.now();
        // Ctrl+C quits pong
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
          this.exitPong();
          return;
        }
        // Game-over screen: any key exits
        if (this.pongGame.isGameOver()) {
          this.exitPong();
          return;
        }
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
      // container.addEventListener('touchstart', () => this.focusInput(), { passive: true });
      // container.addEventListener('click', () => this.focusInput());
    }
  }

  private executeCommand(): void {
    const input = this.inputBuffer.trim();
    if (!input) {
      this.inputBuffer = '';
      this.dirty = true;
      return;
    }

    // Detect exit command and trigger shutdown
    if (input.toLowerCase() === 'exit') {
      this.lines.push({ text: `${this.promptText} ${input}`, type: 'prompt' });
      const result = this.commandParser.parse(input);
      const lineType = result.type ?? (result.error ? 'error' : 'output');
      for (const line of result.lines) {
        this.lines.push({ text: line, type: lineType });
      }
      this.shutdownPending = true;
      this.inputBuffer = '';
      this.dirty = true;
      return;
    }

    this.lines.push({ text: `${this.promptText} ${input}`, type: 'prompt' });
    const result = this.commandParser.parse(input);

    if (result.clear) {
      this.lines = [];
    } else {
      const lineType = result.type ?? (result.error ? 'error' : 'output');
      for (const line of result.lines) {
        this.lines.push({ text: line, type: lineType });
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
      case 'cyan': return this.cyanColor;
      case 'yellow': return this.yellowColor;
      case 'magenta': return this.magentaColor;
      case 'orange': return this.orangeColor;
      case 'white': return this.whiteColor;
      case 'blue': return this.blueColor;
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
    if (!this.scanlinePattern) {
      this.scanlinePattern = this.buildScanlinePattern(w, h, s);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.scanlinePattern, 0, 0);
  }

  private buildScanlinePattern(w: number, h: number, s: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d')!;
    c.fillStyle = `rgba(0, 0, 0, ${0.18 * s})`;
    for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
    c.fillStyle = `rgba(0, 0, 0, ${0.08 * s})`;
    for (let y = 1; y < h; y += 6) c.fillRect(0, y, w, 1);
    c.globalCompositeOperation = 'screen';
    c.fillStyle = `rgba(51, 255, 51, ${0.04 * s})`;
    for (let y = 2; y < h; y += 3) c.fillRect(0, y, w, 1);
    return canvas;
  }

  private applyApertureGrille(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const s = this.APERTURE_STRENGTH;
    if (s <= 0) return;
    if (!this.aperturePattern) {
      this.aperturePattern = this.buildAperturePattern(w, h, s);
    }
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(this.aperturePattern, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  private buildAperturePattern(w: number, h: number, s: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w / 3) * 3;
    canvas.height = h;
    const c = canvas.getContext('2d')!;
    for (let x = 0; x < canvas.width; x += 3) {
      c.fillStyle = `rgba(255, 0, 0, ${0.18 * s})`;
      c.fillRect(x, 0, 1, h);
      c.fillStyle = `rgba(0, 255, 0, ${0.22 * s})`;
      c.fillRect(x + 1, 0, 1, h);
      c.fillStyle = `rgba(0, 0, 255, ${0.18 * s})`;
      c.fillRect(x + 2, 0, 1, h);
    }
    return canvas;
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
    const noiseCount = Math.round(800 * s);
    const margin = 4;
    const boundW = w - margin * 2;
    const boundH = h - margin * 2;

    // Batch by color — only 2 fillStyle changes instead of 800
    ctx.fillStyle = `rgba(200, 255, 200, ${0.22 * s})`;
    for (let i = 0; i < noiseCount; i++) {
      const hash = Math.abs(Math.sin(i * 12.9898 + seed * 78.233));
      if (hash > 0.4) {
        const px = margin + Math.floor(Math.random() * boundW);
        const py = margin + Math.floor(Math.random() * boundH);
        ctx.fillRect(px, py, 1, 1);
      }
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * s})`;
    for (let i = 0; i < noiseCount; i++) {
      const hash = Math.abs(Math.sin(i * 12.9898 + seed * 78.233));
      if (hash <= 0.4) {
        const px = margin + Math.floor(Math.random() * boundW);
        const py = margin + Math.floor(Math.random() * boundH);
        ctx.fillRect(px, py, 1, 1);
      }
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
