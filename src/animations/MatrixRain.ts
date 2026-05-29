/**
 * Matrix rain screensaver.
 * Each column has a "drop" position that increments each frame,
 * drawing a trail of characters.
 */
export class MatrixRain {
  private active = false;
  private drops: number[] = [];
  private readonly chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';
  private readonly fontSize = 16;

  start(columns: number): void {
    this.active = true;
    this.drops = new Array(columns).fill(1);
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active || this.drops.length === 0) return;

    // Fade the entire screen slightly to create trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = `${this.fontSize}px monospace`;
    ctx.textBaseline = 'top';

    const cols = this.drops.length;

    for (let i = 0; i < cols; i++) {
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;

      // Bright head, dimming trail
      if (y < h) {
        ctx.fillStyle = '#fff';
        ctx.fillText(char, x, y);
      }

      // Dimmer previous characters in the trail
      for (let t = 1; t <= 8; t++) {
        const trailY = y - t * this.fontSize;
        if (trailY >= 0 && trailY < h) {
          const alpha = Math.max(0, 1 - t / 6);
          ctx.fillStyle = `rgba(0, 255, 70, ${alpha})`;
          ctx.fillText(
            this.chars[Math.floor(Math.random() * this.chars.length)],
            x,
            trailY
          );
        }
      }

      // Advance drop
      if (y > h && Math.random() > 0.98) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  }
}
