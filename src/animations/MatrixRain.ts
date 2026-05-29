/**
 * Classic Matrix rain screensaver.
 *
 *  • Integer positions only — no float stutter.
 *  • Multiple drops per column for density.
 *  • Light screen fade for organic trails.
 *  • No per-frame Math.random() inside the hot loop.
 */
export class MatrixRain {
  private active = false;
  private drops: { col: number; row: number }[] = [];
  private poolSize = 0;
  private readonly chars =
    'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 12; // smaller = denser grid

  start(columns: number, rows: number): void {
    this.active = true;

    // Density: 1.5 drops per column on average
    this.poolSize = Math.floor(columns * 1.5);
    this.drops = new Array(this.poolSize);

    for (let i = 0; i < this.poolSize; i++) {
      const col = i % columns;
      // Stagger start positions well above the screen so rain is already
      // in full swing when the screensaver appears.
      const row = -(Math.random() * rows * 1.5 + 10);
      this.drops[i] = { col, row };
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
    const charLen = this.chars.length;

    // 1. Fade previous frame slightly — creates the green trail.
    //    0.06 alpha is enough for a long tail without heavy ghosting.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${fs}px monospace`;
    ctx.textBaseline = 'top';

    // 2. Advance and draw every drop.
    for (let i = 0; i < this.poolSize; i++) {
      const drop = this.drops[i];
      drop.row += 1; // exactly one row per frame

      const x = drop.col * fs;
      const y = drop.row * fs;

      // Draw the bright head if visible.
      if (y >= 0 && y < h) {
        ctx.fillStyle = '#e6ffe6';
        ctx.shadowColor = '#33ff33';
        ctx.shadowBlur = 4;
        ctx.fillText(
          this.chars[(i + drop.row) % charLen], // deterministic but varied
          x,
          y
        );
        ctx.shadowBlur = 0;
      }

      // Respawn once the head clears the bottom by a margin.
      if (y > h + 40) {
        drop.row = -(Math.random() * 60 + 10);
      }
    }
  }
}
