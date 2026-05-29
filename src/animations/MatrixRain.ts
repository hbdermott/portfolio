/**
 * Classic Matrix rain effect.
 *
 * Algorithm: one "drop" per screen column.  Each frame we draw a
 * semi-transparent black rectangle over the entire canvas so old
 * characters fade into a green trail.  Then we draw a bright
 * white-green character at each drop's current Y.  Drops move at
 * slightly different speeds so they never visually sync up.
 *
 * Drops spawn at random Y positions across the whole screen so the
 * rain is dense and visible immediately — nothing starts off-screen.
 */
export class MatrixRain {
  private active = false;
  /** Row position (can be fractional) for every column */
  private drops: number[] = [];
  /** Fall speed (rows/frame) for every column */
  private speeds: number[] = [];
  /** Pre-computed character for each column so it doesn't flicker */
  private columnChars: string[] = [];
  private readonly chars =
    'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 13;

  start(w: number, h: number): void {
    this.active = true;
    const cols = Math.ceil(w / this.fontSize);
    const rows = Math.ceil(h / this.fontSize);
    this.drops = new Array(cols);
    this.speeds = new Array(cols);
    this.columnChars = new Array(cols);

    for (let i = 0; i < cols; i++) {
      // Start at a random row so the screen is full immediately.
      this.drops[i] = Math.random() * rows;
      // Vary speed so columns don't visually sync up.
      this.speeds[i] = 0.5 + Math.random() * 1.0; // 0.5–1.5 rows/frame
      // Pick one character per column; it will change on respawn.
      this.columnChars[i] = this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    const fs = this.fontSize;
    const cols = this.drops.length;
    const charLen = this.chars.length;

    // 1. Fade previous frame — creates the green tail.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fs}px monospace`;
    ctx.textBaseline = 'top';

    // 2. Advance and draw every column's drop.
    for (let i = 0; i < cols; i++) {
      this.drops[i] += this.speeds[i];

      const y = this.drops[i] * fs;

      // Draw the bright head.
      if (y < h) {
        ctx.fillStyle = '#e6ffe6';
        ctx.fillText(this.columnChars[i], i * fs, y);
      }

      // Respawn once the head leaves the bottom.
      if (y > h + fs * 2) {
        this.drops[i] = 0;
        this.speeds[i] = 0.5 + Math.random() * 1.0;
        this.columnChars[i] = this.chars[Math.floor(Math.random() * charLen)];
      }
    }
  }
}
