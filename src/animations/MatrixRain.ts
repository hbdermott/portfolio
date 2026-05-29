/**
 * Classic Matrix rain effect.
 *
 * Each "drop" is a vertical streak of characters falling downward.
 * The head (bottom character) is bright white-green.  The trail above
 * it is a fading gradient of green characters.  A semi-transparent
 * black overlay each frame creates the persistence fade.
 *
 * Drops are constrained to a safe area inset from the canvas edges
 * to avoid drawing into CRT bezel / scanline border regions.
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

  private readonly chars =
    'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 14;
  private readonly density = 0.8;
  private speedScale = 0.45; // global multiplier; 0.45 = slow / cinematic

  start(w: number, h: number, speedScale = 0.45): void {
    this.active = true;
    this.speedScale = speedScale;

    // Safe area: inset from edges so drops don't draw into the CRT bezel.
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

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active || this.drops.length === 0) return;

    const fs = this.fontSize;

    // 1. Fade previous frame — old characters dim into a green trail.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fs}px monospace`;
    ctx.textBaseline = 'top';

    // 2. Advance and draw every drop.
    for (const drop of this.drops) {
      drop.y += drop.speed;

      // Draw each character in the streak, from head (bottom) up.
      for (let i = 0; i < drop.chars.length; i++) {
        const row = drop.y - i; // i=0 is head (bottom), i>0 is trail above
        const py = this.marginY + row * fs;

        // Skip off-screen characters (safe area only)
        if (py < this.marginY - fs || py > this.marginY + this.safeH) continue;

        // Brightness fades linearly from the head (white) to the tail end (dark green).
        const progress = i / drop.chars.length; // 0 at head, 1 at tail end
        const intensity = Math.max(0.06, 1 - progress);

        if (i === 0) {
          // Head: pure bright white
          ctx.fillStyle = '#ffffff';
        } else {
          // Trail: white-green near head, pure green mid, dark green at tail
          const g = Math.floor(255 * intensity);
          // Slight red/blue tint near the head for a white-green glow
          const wb = Math.max(0, Math.floor((intensity - 0.5) * 300));
          ctx.fillStyle = `rgb(${wb}, ${g}, ${wb})`;
        }

        ctx.fillText(drop.chars[i], this.marginX + drop.x * fs, py);
      }

      // Respawn once the entire streak has fallen off the bottom.
      if (drop.y - drop.chars.length > this.rows) {
        Object.assign(drop, this.createDrop(false));
      }
    }
  }

  private createDrop(scatter: boolean): MatrixDrop {
    const length = Math.floor(Math.random() * 16) + 6; // 6-21 chars
    const chars: string[] = new Array(length);
    for (let i = 0; i < length; i++) {
      chars[i] = this.chars[Math.floor(Math.random() * this.chars.length)];
    }

    return {
      x: Math.floor(Math.random() * this.cols),
      y: scatter
        ? Math.random() * (this.rows + length) - length // anywhere on or above screen
        : -length, // start just above the top
      speed: (Math.random() * 1.0 + 0.3) * this.speedScale, // 0.3-1.3 * scale
      chars,
    };
  }
}

interface MatrixDrop {
  x: number; // column index within safe area
  y: number; // head row position (float)
  speed: number; // rows per frame
  chars: string[]; // characters in the streak, head first
}
