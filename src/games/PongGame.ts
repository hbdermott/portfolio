/**
 * Pong game rendered on the terminal canvas.
 *
 * Player (left) vs AI (right).
 * Predictive collision — we check where the ball *will* be next frame
 * and compute the exact Y intersection with the paddle plane.
 * Deflection angle depends on paddle hit offset (center = shallow,
 * edge = steep) and the incoming angle is rotated rather than replaced.
 *
 * Controls: Up/Down arrows or W/S.  Ctrl+C to quit.
 */
export class PongGame {
  private active = false;
  private gameOver = false;

  // Canvas size (same as terminal texture)
  private readonly W = 1024;
  private readonly H = 768;

  // Paddles
  private readonly paddleW = 14;
  private readonly paddleH = 100;
  private readonly paddleInset = 40; // gap from left/right edge
  private leftY = 0;
  private rightY = 0;

  // Ball
  private ballX = 0;
  private ballY = 0;
  private ballVX = 0;
  private ballVY = 0;
  private readonly ballR = 6;
  private readonly ballSpeedStart = 6.5;
  private readonly ballSpeedMax = 13;

  // Score
  private leftScore = 0;
  private rightScore = 0;
  private readonly winScore = 5;

  // AI
  private aiSpeed = 5.5;
  private aiReactionDist = -0.6; // fraction of screen width
  private aiLag = 0; // frames of lag before AI reacts
  private aiLagCounter = 0;

  // Input
  private upPressed = false;
  private downPressed = false;

  // Timing
  private lastTick = 0;
  private readonly tickRate = 16; // ~60 Hz game logic

  start(): void {
    this.active = true;
    this.gameOver = false;
    this.leftScore = 0;
    this.rightScore = 0;
    this.leftY = this.H / 2 - this.paddleH / 2;
    this.rightY = this.H / 2 - this.paddleH / 2;
    this.upPressed = false;
    this.downPressed = false;
    this.resetBall(1);
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  handleKey(key: string, pressed: boolean): void {
    if (!this.active) return;
    if (['ArrowDown', 's', 'S'].includes(key)) this.downPressed = pressed;
    if (['ArrowUp', 'w', 'W'].includes(key)) this.upPressed = pressed;
  }

  update(time: number): void {
    if (!this.active || this.gameOver) return;
    if (time - this.lastTick > this.tickRate) {
      this.lastTick = time;
      this.tick();
    }
  }

  private tick(): void {
    // ─── Player paddle ───
    const paddleSpeed = 8;
    if (this.upPressed) this.leftY -= paddleSpeed;
    if (this.downPressed) this.leftY += paddleSpeed;
    this.leftY = Math.max(0, Math.min(this.H - this.paddleH, this.leftY));

    // ─── AI paddle ───
    // Only react once the ball has crossed the reaction-distance threshold.
    const ballNormX = (this.ballX - this.W / 2) / (this.W / 2); // -1 … 1
    if (ballNormX > this.aiReactionDist && this.ballVX > 0) {
      this.aiLagCounter++;
      if (this.aiLagCounter > this.aiLag) {
        this.aiLagCounter = 0;
        const target = this.ballY - this.paddleH / 2;
        const diff = target - this.rightY;
        if (Math.abs(diff) > 4) {
          this.rightY += Math.sign(diff) * this.aiSpeed;
        }
      }
    }
    this.rightY = Math.max(0, Math.min(this.H - this.paddleH, this.rightY));

    // ─── Move ball ───
    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // ─── Top / bottom wall bounce ───
    if (this.ballY - this.ballR <= 0) {
      this.ballY = this.ballR;
      this.ballVY = Math.abs(this.ballVY);
    } else if (this.ballY + this.ballR >= this.H) {
      this.ballY = this.H - this.ballR;
      this.ballVY = -Math.abs(this.ballVY);
    }

    // ─── Predictive paddle collision ───
    const leftPlane = this.paddleInset + this.paddleW;  // right edge of left paddle
    const rightPlane = this.W - this.paddleInset - this.paddleW; // left edge of right paddle

    // Left paddle (player)
    if (this.ballVX < 0) {
      const nextX = this.ballX + this.ballVX;
      if (this.ballX > leftPlane && nextX <= leftPlane + this.ballR) {
        const t = (leftPlane + this.ballR - this.ballX) / this.ballVX; // 0 < t ≤ 1
        const hitY = this.ballY + this.ballVY * t;
        const paddleCenter = this.leftY + this.paddleH / 2;
        if (Math.abs(paddleCenter - hitY) <= this.paddleH / 2 + this.ballR) {
          this.deflect(hitY, paddleCenter, -1);
        }
      }
    }

    // Right paddle (AI)
    if (this.ballVX > 0) {
      const nextX = this.ballX + this.ballVX;
      if (this.ballX < rightPlane && nextX >= rightPlane - this.ballR) {
        const t = (rightPlane - this.ballR - this.ballX) / this.ballVX;
        const hitY = this.ballY + this.ballVY * t;
        const paddleCenter = this.rightY + this.paddleH / 2;
        if (Math.abs(paddleCenter - hitY) <= this.paddleH / 2 + this.ballR) {
          this.deflect(hitY, paddleCenter, 1);
        }
      }
    }

    // ─── Scoring ───
    if (this.ballX + this.ballR < 0) {
      this.rightScore++;
      if (this.rightScore >= this.winScore) {
        this.gameOver = true;
      } else {
        this.resetBall(1);
      }
    } else if (this.ballX - this.ballR > this.W) {
      this.leftScore++;
      if (this.leftScore >= this.winScore) {
        this.gameOver = true;
      } else {
        this.resetBall(-1);
      }
    }
  }

  /**
   * Deflect the ball using a rotation-based formula.
   *
   * 1. Compute the paddle-hit offset (how far from paddle center).
   * 2. Turn that offset into an additional rotation angle.
   * 3. Rotate the existing velocity vector by that angle.
   * 4. Speed up by ~2% per rally.
   */
  private deflect(hitY: number, paddleCenter: number, direction: 1 | -1): void {
    const offset = paddleCenter - hitY;           // positive = hit above center
    const normalized = offset / (this.paddleH / 2); // -1 … 1

    // Base rotation from paddle offset (max ±35°)
    const offsetAngle = normalized * (Math.PI / 5.2);

    // Current velocity angle
    const currentAngle = Math.atan2(this.ballVY, this.ballVX);

    // Total outgoing angle: flip horizontal + add offset rotation
    const outAngle = (direction === -1 ? 0 : Math.PI) + offsetAngle;

    // Blend incoming and outgoing for a natural feel (30% incoming, 70% desired)
    const finalAngle = currentAngle * 0.3 + outAngle * 0.7;

    // Speed up slightly, capped at max
    let speed = Math.hypot(this.ballVX, this.ballVY) * 1.025;
    speed = Math.min(speed, this.ballSpeedMax);

    this.ballVX = speed * Math.cos(finalAngle);
    this.ballVY = speed * Math.sin(finalAngle);
  }

  private resetBall(direction: 1 | -1): void {
    this.ballX = this.W / 2;
    this.ballY = this.H / 2;
    const angle = (Math.random() - 0.5) * (Math.PI / 4);
    this.ballVX = direction * this.ballSpeedStart * Math.cos(angle);
    this.ballVY = this.ballSpeedStart * Math.sin(angle);

    // Randomise AI personality for next rally
    this.aiSpeed = Math.random() * 4 + 4.5;      // 4.5–8.5
    this.aiReactionDist = Math.random() * 0.5 - 0.8; // -0.8 … -0.3
    this.aiLag = Math.floor(Math.random() * 6);    // 0–5 frames
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    // Background — match terminal CRT background
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, w, h);

    // Center dotted line
    ctx.fillStyle = 'rgba(51, 255, 51, 0.12)';
    for (let y = 0; y < h; y += 22) {
      ctx.fillRect(w / 2 - 1, y, 2, 11);
    }

    // Paddles
    ctx.fillStyle = '#33ff33';
    ctx.shadowColor = '#33ff33';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.paddleInset, this.leftY, this.paddleW, this.paddleH);
    ctx.fillRect(w - this.paddleInset - this.paddleW, this.rightY, this.paddleW, this.paddleH);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(this.leftScore), w / 4, 36);
    ctx.fillText(String(this.rightScore), (w * 3) / 4, 36);

    // Controls hint
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Up/Down or W/S to move    Ctrl+C to quit', w / 2, h - 24);

    // Game Over overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 36);

      ctx.font = '22px monospace';
      ctx.fillStyle = '#33ff33';
      const msg = this.leftScore >= this.winScore ? 'You Win!' : 'AI Wins';
      ctx.fillText(msg, w / 2, h / 2 + 4);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Press any key to exit', w / 2, h / 2 + 36);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
