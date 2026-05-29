/**
 * Classic Matrix rain effect.
 *
 * Algorithm: one "drop" per screen column.  Each frame we draw a
 * semi-transparent black rectangle over the entire canvas so old
 * characters fade into a green trail.  Then we draw a bright
 * white-green character at each drop's current Y.  The drop row
 * increments by 1 every frame, giving a smooth constant-speed fall.
 *
 * Drops spawn at random Y positions across the whole screen so the
 * rain is dense and visible immediately — nothing starts off-screen.
 */
export class MatrixRain {
  private active = false;
  /** Row position (can be fractional) for every column */
  private drops: number[] = [];
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
    this.columnChars = new Array(cols);

    for (let i = 0; i < cols; i++) {
      // Start at a random row so the screen is full immediately.
      this.drops[i] = Math.random() * rows;
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
      this.drops[i] += 1;

      const y = this.drops[i] * fs;

      // Draw the bright head.
      if (y < h) {
        ctx.fillStyle = '#e6ffe6';
        ctx.fillText(this.columnChars[i], i * fs, y);
      }

      // Respawn once the head leaves the bottom.
      if (y > h + fs * 2) {
        this.drops[i] = 0;
        this.columnChars[i] = this.chars[Math.floor(Math.random() * charLen)];
      }
    }
  }
}
