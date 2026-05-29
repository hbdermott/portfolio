/**
 * Matrix rain screensaver.
 * Renders falling katakana/green characters on a canvas.
 */
export class MatrixRain {
  private active = false;
  private drops: number[] = [];
  private chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾉﾀｽﾁﾄﾈﾊﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙ0123456789ABCDEF';

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
    if (!this.active) return;

    const fontSize = 14;
    const columns = Math.floor(w / fontSize);

    if (this.drops.length !== columns) {
      this.drops = new Array(columns).fill(1);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0F0';
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < columns; i++) {
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];
      const x = i * fontSize;
      const y = this.drops[i] * fontSize;

      // Gradient: bright at head, dimmer trail
      const headDist = Math.abs(y - this.drops[i] * fontSize);
      const alpha = headDist < fontSize * 3 ? 1 : 0.5 + Math.random() * 0.3;
      ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
      ctx.fillText(char, x, y);

      if (y > h && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  }
}
