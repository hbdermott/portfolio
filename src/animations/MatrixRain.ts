/**
 * Config for per-effect tuning of the Matrix rain + CRT overlay.
 * Pass a partial config to start() — missing fields use defaults.
 */
export interface MatrixConfig {
  fadeAlpha?: number;      // 0.0–1.0  (default 0.05)
  enableVignette?: boolean; // (default true)
  enableScanlines?: boolean;// (default true)
  enableAperture?: boolean;// (default true)
  enableChromatic?: boolean;// (default true)
  chromaticSkip?: number;  // frames to skip (default 2)
  enableNoise?: boolean;   // (default true)
  noiseCount?: number;     // pixels per frame (default 800)
  enableFlicker?: boolean; // (default true)
}

const DEFAULT_CONFIG: Required<MatrixConfig> = {
  fadeAlpha: 0.05,
  enableVignette: true,
  enableScanlines: true,
  enableAperture: true,
  enableChromatic: false,
  chromaticSkip: 0,
  enableNoise: true,
  noiseCount: 800,
  enableFlicker: true,
};

/**
 * Classic Matrix rain effect with pre-rendered streaks.
 *
 * Each drop's streak is baked into an offscreen canvas at spawn time.
 * The render loop only does cheap `drawImage` calls — no per-character
 * fillText / fillStyle changes on the hot path.
 */
export class MatrixRain {
  private active = false;
  private safeW = 0;
  private safeH = 0;
  private marginX = 0;
  private marginY = 0;
  private cols = 0;
  private rows = 0;
  private drops: MatrixDrop[] = [];
  private charsLen = 0; // cached

  private currentConfig: Required<MatrixConfig> = { ...DEFAULT_CONFIG };

  private readonly chars =
    'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 20;
  private readonly density = 5;
  private readonly speedScale = 0.1;

  start(w: number, h: number, config?: MatrixConfig): void {
    this.active = true;
    this.currentConfig = { ...DEFAULT_CONFIG, ...config };
    this.charsLen = this.chars.length;

    this.marginX = Math.round(w * 0.04);
    this.marginY = Math.round(h * 0.04);
    this.safeW = w - this.marginX * 2;
    this.safeH = h - this.marginY * 2;

    this.cols = Math.ceil(this.safeW / this.fontSize);
    this.rows = Math.ceil(this.safeH / this.fontSize);

    const count = Math.floor(this.cols * this.density);
    this.drops = new Array(count);

    for (let i = 0; i < count; i++) {
      this.drops[i] = this.createDrop(true);
    }
  }

  stop(): void {
    this.active = false;
    this.drops = [];
  }

  isActive(): boolean {
    return this.active;
  }

  /** Read-only config for the renderer to query which CRT effects to apply. */
  getConfig(): Required<MatrixConfig> {
    return this.currentConfig;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active || this.drops.length === 0) return;

    const cfg = this.currentConfig;

    // Fade overlay — use globalAlpha (faster than parsing rgba string)
    ctx.globalAlpha = cfg.fadeAlpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;

    const fs = this.fontSize;
    const drops = this.drops;
    const len = drops.length;
    const mx = this.marginX;
    const my = this.marginY;
    const safeH = this.safeH;
    const rows = this.rows;

    for (let i = 0; i < len; i++) {
      const drop = drops[i];
      drop.y += drop.speed;

      const streakLen = drop.chars.length;
      const headY = my + drop.y * fs;
      const topY = headY - (streakLen - 1) * fs;
      const bottomY = headY + fs;

      // Skip if entirely off-screen, but still check respawn
      if (topY > my + safeH || bottomY < my - fs) {
        if (drop.y - streakLen > rows) {
          this.resetDrop(drop, false);
        }
        continue;
      }

      ctx.drawImage(drop.streakCanvas, mx + drop.x * fs, topY);

      if (drop.y - streakLen > rows) {
        this.resetDrop(drop, false);
      }
    }
  }

  private createDrop(scatter: boolean): MatrixDrop {
    const length = Math.floor(Math.random() * 16) + 6;
    const chars: string[] = new Array(length);
    for (let i = 0; i < length; i++) {
      chars[i] = this.chars[Math.floor(Math.random() * this.charsLen)];
    }

    const canvas = this.buildStreakCanvas(chars);

    return {
      x: Math.floor(Math.random() * this.cols),
      y: scatter
        ? Math.random() * (this.rows + length) - length
        : -length,
      speed: (Math.random() * 1.0 + 0.3) * this.speedScale,
      chars,
      streakCanvas: canvas,
    };
  }

  private resetDrop(drop: MatrixDrop, scatter: boolean): void {
    const length = Math.floor(Math.random() * 16) + 6;
    drop.chars = new Array(length);
    for (let i = 0; i < length; i++) {
      drop.chars[i] = this.chars[Math.floor(Math.random() * this.charsLen)];
    }

    drop.streakCanvas = this.buildStreakCanvas(drop.chars, drop.streakCanvas);
    drop.x = Math.floor(Math.random() * this.cols);
    drop.y = scatter
      ? Math.random() * (this.rows + length) - length
      : -length;
    drop.speed = (Math.random() * 1.0 + 0.3) * this.speedScale;
  }

  /** Bake a streak's characters into an offscreen canvas.  If an existing
   *  canvas is passed, it is resized and redrawn to avoid GC churn. */
  private buildStreakCanvas(chars: string[], existing?: HTMLCanvasElement): HTMLCanvasElement {
    const len = chars.length;
    const fs = this.fontSize;
    const canvas = existing ?? document.createElement('canvas');
    canvas.width = fs;
    canvas.height = len * fs;

    const cctx = canvas.getContext('2d')!;
    cctx.imageSmoothingEnabled = false;
    cctx.font = `${fs}px monospace`;
    cctx.textBaseline = 'top';

    for (let i = 0; i < len; i++) {
      const progress = i / len;
      const intensity = Math.max(0.06, 1 - progress);

      if (i === 0) {
        cctx.fillStyle = '#ffffff';
      } else {
        const g = Math.floor(255 * intensity);
        const wb = Math.max(0, Math.floor((intensity - 0.5) * 300));
        cctx.fillStyle = `rgb(${wb}, ${g}, ${wb})`;
      }

      // Head at bottom of canvas, tail at top
      cctx.fillText(chars[i], 0, (len - 1 - i) * fs);
    }

    return canvas;
  }
}

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  streakCanvas: HTMLCanvasElement;
}
