/**
 * Pong — direct port of the provided reference implementation.
 *
 * Coordinate space: internal logic runs on a 500×500 virtual canvas
 * with normalised coordinates (-1 … 1).  Rendering is scaled to the
 * terminal’s 1024×768 texture via ctx.scale().
 *
 * Controls: mouse Y anywhere on screen moves the left paddle.
 *           Ctrl+C to quit.
 */
export class PongGame {
  private active = false;

  // ─── internal state (exact names from reference) ───
  private paddles = [0, 0];          // normalised Y, 0 = centre
  private ball = [0, 0, -0.016, 0]; // [x, y, vx, vy]
  private score = [0, 0];
  private cursor = 0;                // mouse Y normalised
  private reactionSpeed = 6;
  private reactionDistance = -0.5;

  private readonly VIRTUAL_W = 500;
  private readonly VIRTUAL_H = 500;

  // Mouse listener cleanup
  private mouseHandler: ((e: MouseEvent) => void) | null = null;

  start(): void {
    this.active = true;
    this.paddles = [0, 0];
    this.ball = [0, 0, -0.016, 0];
    this.score = [0, 0];
    this.cursor = 0;
    this.reactionSpeed = 6;
    this.reactionDistance = -0.5;

    this.mouseHandler = (e: MouseEvent) => {
      // Map window Y to normalised -1 … 1
      this.cursor = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', this.mouseHandler);
  }

  stop(): void {
    this.active = false;
    if (this.mouseHandler) {
      window.removeEventListener('mousemove', this.mouseHandler);
      this.mouseHandler = null;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  isGameOver(): boolean {
    return Math.abs(this.ball[0]) >= 1;
  }

  /** One game tick — runs once per frame (~60 Hz). */
  tick(): void {
    if (!this.active) return;

    const b = this.ball;
    const p = this.paddles;

    // ─── scoring ───
    if (Math.abs(b[0]) >= 1) {
      this.score[b[0] < 0 ? 1 : 0]++;
      b[0] = 0; b[1] = 0;
      b[2] = b[0] < 0 ? -0.016 : 0.016; // reset with opposite direction
      b[3] = 0;
      this.reactionDistance = -0.5;
      this.reactionSpeed = 6;
      return;
    }

    // ─── wall bounce (top / bottom) ───
    if (Math.abs(b[1]) >= 1) {
      b[3] = -b[3];
    }

    // ─── move ball ───
    b[0] += b[2];
    b[1] += b[3];

    // ─── player paddle follows mouse ───
    p[0] = this.cursor;

    // ─── AI paddle ───
    if (b[0] > this.reactionDistance && b[2] > 0) {
      const halfH = 10 / 250; // paddle half-height in normalised space
      const aiStep = this.reactionSpeed / 250;
      if (b[1] > p[1] + halfH) {
        p[1] += aiStep;
      } else if (b[1] < p[1] - halfH) {
        p[1] -= aiStep;
      }
    }

    // ─── clamp paddles ───
    const limit = 210 / 250;
    for (let i = 0; i < 2; i++) {
      if (Math.abs(p[i]) > limit) {
        p[i] = (p[i] / Math.abs(p[i])) * limit;
      }
    }

    // ─── paddle collision ───
    const plane = 220 / 250; // paddle face in normalised space
    const halfPaddle = 30 / 250; // 25px half-height + 5px ball radius

    // left paddle
    const hitLeft =
      b[0] > -plane &&
      b[0] + b[2] <= -plane &&
      Math.abs(p[0] - b[1] - b[3] * (-plane - b[0]) / b[2]) <= halfPaddle;

    // right paddle
    const hitRight =
      b[0] < plane &&
      b[0] + b[2] >= plane &&
      Math.abs(p[1] - b[1] - b[3] * (plane - b[0]) / b[2]) <= halfPaddle;

    if (hitLeft || hitRight) {
      const sign = b[0] < 0 ? 1 : -1;
      const paddleIdx = b[0] < 0 ? 0 : 1;
      const incoming = Math.atan(b[3] / -b[2]);

      const alpha = sign * (
        (7 / 16) * (incoming + Math.PI / 2)
        + 0.004375 * Math.PI * (b[1] - p[paddleIdx]) * 500
        + (27 / 64) * Math.PI
        - incoming
        + Math.PI * 3 / 8
      );

      const x = b[2] * Math.cos(alpha) - b[3] * Math.sin(alpha);
      const y = b[2] * Math.sin(alpha) + b[3] * Math.cos(alpha);

      b[2] = x * 1.02;
      b[3] = y * 1.02;
      this.reactionSpeed = Math.random() * 4.5 + 1.7;
      this.reactionDistance = Math.random() * 0.7 - 1;
    }
  }

  /** Render the current frame onto the provided context. */
  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    // Scale from virtual 500×500 to actual texture size
    ctx.save();
    ctx.scale(w / this.VIRTUAL_W, h / this.VIRTUAL_H);

    // Background
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, this.VIRTUAL_W, this.VIRTUAL_H);

    // Dashed centre line
    ctx.fillStyle = 'rgba(51, 255, 51, 0.15)';
    for (let y = 0; y < this.VIRTUAL_H; y += 24) {
      ctx.fillRect(this.VIRTUAL_W / 2 - 1, y, 2, 12);
    }

    // Paddles
    ctx.fillStyle = '#33ff33';
    ctx.shadowColor = '#33ff33';
    ctx.shadowBlur = 8;
    ctx.fillRect(20, this.paddles[0] * 250 + 225, 10, 50);
    ctx.fillRect(470, this.paddles[1] * 250 + 225, 10, 50);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    const bx = this.ball[0] * 250 + 245;
    const by = this.ball[1] * 250 + 245;
    ctx.fillRect(bx, by, 10, 10);
    ctx.shadowBlur = 0;

    // Score
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px monospace';
    ctx.fillStyle = '#33ff33';
    ctx.fillText(`${this.score[0]} : ${this.score[1]}`, 250, 100);

    // Hint
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Move mouse to play    Ctrl+C to quit', 250, 480);

    ctx.restore();
  }
}
