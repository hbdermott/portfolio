/**
 * Matrix rain screensaver.
 *
 * Each column spawns a single drop head that falls downward
 * one row per frame.  A semi-transparent black overlay is drawn
 * every frame, so old characters fade into a green trail behind
 * the bright head.  When a drop exits the bottom it respawns at
 * a random height above the screen so the rain never syncs up.
 */
export class MatrixRain {
  private active = false;
  /** Drop row position for every column (can be negative = above screen) */
  private drops: number[] = [];
  /** Random start offset so columns don't all begin at the same time */
  private delays: number[] = [];
  private readonly chars =
    'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 16;
  private cols = 0;

  start(columns: number): void {
    this.active = true;
    this.cols = columns;
    // Every column starts at a random negative row so the rain
    // is already in full swing when the screensaver appears.
    this.drops = new Array(columns)
      .fill(0)
      .map(() => -(Math.random() * 40 + 5));
    // Staggered speed variation: some columns advance every frame,
    // others skip a frame occasionally.
    this.delays = new Array(columns)
      .fill(0)
      .map(() => Math.random());
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    const cols = this.cols;
    const fs = this.fontSize;

    // 1. Slightly darken the whole screen so previous characters
    //    become a fading green trail.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fs}px monospace`;
    ctx.textBaseline = 'top';

    // 2. Draw each falling drop.
    for (let i = 0; i < cols; i++) {
      // Some columns advance slower than others for visual variety.
      if (Math.random() < this.delays[i]) continue;

      const x = i * fs;
      const row = Math.floor(this.drops[i]);
      const y = row * fs;

      // Only draw if on-screen (plus a small margin so the very top
      // head doesn't pop in out of nowhere).
      if (y >= -fs && y < h + fs) {
        const char = this.chars[Math.floor(Math.random() * this.chars.length)];

        // Head glows bright white-green.
        ctx.fillStyle = '#ccffcc';
        ctx.shadowColor = '#33ff33';
        ctx.shadowBlur = 6;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
      }

      // 3. Advance drop.  Once it leaves the bottom by a fair margin
      //    respawn it somewhere above the screen so the rain loops
      //    continuously without ever syncing up.
      this.drops[i] += 0.5 + Math.random() * 0.7; // variable fall speed
      if (this.drops[i] * fs > h + 60) {
        this.drops[i] = -(Math.random() * 50 + 10);
      }
    }
  }
}
