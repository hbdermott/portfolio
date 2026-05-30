/**
 * Classic Pong game rendered on the terminal canvas.
 *
 * Left paddle = player (Up/Down or W/S).
 * Right paddle = simple AI that tracks the ball.
 * First to 5 points wins.  Ctrl+C to quit at any time.
 */
export class PongGame {
  private active = false;
  private readonly width = 1024;
  private readonly height = 768;

  // Paddle dimensions
  private readonly paddleW = 14;
  private readonly paddleH = 100;
  private readonly paddleOffset = 40; // distance from edge

  // Ball
  private ball = { x: 512, y: 384, vx: 5, vy: 3, r: 6 };
  private readonly ballSpeedBase = 5;
  private readonly ballSpeedMax = 12;

  // Paddles
  private leftPaddle = { y: 334 };
  private rightPaddle = { y: 334 };

  // AI
  private aiSpeed = 4.5;
  private aiReactionDelay = 0; // frames before AI reacts
  private aiReactionCounter = 0;

  // Score
  private leftScore = 0;
  private rightScore = 0;
  private readonly winScore = 5;
  private gameOver = false;
  private winner: 'player' | 'ai' | null = null;

  // Input
  private upPressed = false;
  private downPressed = false;

  // Timing
  private lastTick = 0;
  private readonly tickRate = 16; // ~60fps game logic

  isGameOver(): boolean {
    return this.gameOver;
  }

  start(): void {
    this.active = true;
    this.gameOver = false;
    this.winner = null;
    this.leftScore = 0;
    this.rightScore = 0;
    this.resetBall(1);
    this.leftPaddle.y = this.height / 2 - this.paddleH / 2;
    this.rightPaddle.y = this.height / 2 - this.paddleH / 2;
    this.upPressed = false;
    this.downPressed = false;
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  handleKey(key: string, pressed: boolean): void {
    if (!this.active) return;
    const down = ['ArrowDown', 's', 'S'];
    const up = ['ArrowUp', 'w', 'W'];
    if (down.includes(key)) this.downPressed = pressed;
    if (up.includes(key)) this.upPressed = pressed;
  }

  update(time: number): void {
    if (!this.active || this.gameOver) return;

    if (time - this.lastTick > this.tickRate) {
      this.lastTick = time;
      this.tick();
    }
  }

  private tick(): void {
    // Move player paddle
    const paddleSpeed = 6;
    if (this.upPressed) this.leftPaddle.y -= paddleSpeed;
    if (this.downPressed) this.leftPaddle.y += paddleSpeed;

    // Clamp player paddle
    this.leftPaddle.y = Math.max(0, Math.min(this.height - this.paddleH, this.leftPaddle.y));

    // AI paddle tracking
    this.aiReactionCounter++;
    if (this.aiReactionCounter > this.aiReactionDelay) {
      this.aiReactionCounter = 0;
      const targetY = this.ball.y - this.paddleH / 2;
      const diff = targetY - this.rightPaddle.y;
      if (Math.abs(diff) > 5) {
        this.rightPaddle.y += Math.sign(diff) * this.aiSpeed;
      }
    }

    // Clamp AI paddle
    this.rightPaddle.y = Math.max(0, Math.min(this.height - this.paddleH, this.rightPaddle.y));

    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Top/bottom wall bounce
    if (this.ball.y - this.ball.r <= 0) {
      this.ball.y = this.ball.r;
      this.ball.vy = Math.abs(this.ball.vy);
    } else if (this.ball.y + this.ball.r >= this.height) {
      this.ball.y = this.height - this.ball.r;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // Paddle collision — left
    if (
      this.ball.vx < 0 &&
      this.ball.x - this.ball.r <= this.paddleOffset + this.paddleW &&
      this.ball.x - this.ball.r >= this.paddleOffset &&
      this.ball.y >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.paddleH
    ) {
      this.ball.x = this.paddleOffset + this.paddleW + this.ball.r;
      this.deflect(this.leftPaddle.y, -1);
    }

    // Paddle collision — right
    if (
      this.ball.vx > 0 &&
      this.ball.x + this.ball.r >= this.width - this.paddleOffset - this.paddleW &&
      this.ball.x + this.ball.r <= this.width - this.paddleOffset &&
      this.ball.y >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.paddleH
    ) {
      this.ball.x = this.width - this.paddleOffset - this.paddleW - this.ball.r;
      this.deflect(this.rightPaddle.y, 1);
    }

    // Score — left wall (AI scores)
    if (this.ball.x + this.ball.r < 0) {
      this.rightScore++;
      if (this.rightScore >= this.winScore) {
        this.gameOver = true;
        this.winner = 'ai';
      } else {
        this.resetBall(1);
      }
    }

    // Score — right wall (player scores)
    if (this.ball.x - this.ball.r > this.width) {
      this.leftScore++;
      if (this.leftScore >= this.winScore) {
        this.gameOver = true;
        this.winner = 'player';
      } else {
        this.resetBall(-1);
      }
    }
  }

  private deflect(paddleY: number, direction: 1 | -1): void {
    // Angle depends on where the ball hit the paddle (center = flat, edge = steep)
    const relativeIntersectY = (paddleY + this.paddleH / 2) - this.ball.y;
    const normalized = relativeIntersectY / (this.paddleH / 2);
    const bounceAngle = normalized * (Math.PI / 3); // max 60 degrees

    const speed = Math.min(this.ballSpeedMax, Math.hypot(this.ball.vx, this.ball.vy) + 0.5);
    this.ball.vx = direction * speed * Math.cos(bounceAngle);
    this.ball.vy = -speed * Math.sin(bounceAngle);
  }

  private resetBall(direction: 1 | -1): void {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    this.ball.vx = direction * this.ballSpeedBase * Math.cos(angle);
    this.ball.vy = this.ballSpeedBase * Math.sin(angle);
    this.aiReactionDelay = Math.floor(Math.random() * 15); // random AI reaction time
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    // Background — match terminal CRT background
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, w, h);

    // Center dotted line
    ctx.fillStyle = 'rgba(51, 255, 51, 0.15)';
    for (let y = 0; y < h; y += 24) {
      ctx.fillRect(w / 2 - 1, y, 2, 12);
    }

    // Paddles
    ctx.fillStyle = '#33ff33';
    ctx.shadowColor = '#33ff33';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.paddleOffset, this.leftPaddle.y, this.paddleW, this.paddleH);
    ctx.fillRect(w - this.paddleOffset - this.paddleW, this.rightPaddle.y, this.paddleW, this.paddleH);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(this.leftScore), w / 4, 40);
    ctx.fillText(String(this.rightScore), (w * 3) / 4, 40);

    // Controls hint
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Up/Down or W/S to move    Ctrl+C to quit', w / 2, h - 24);

    // Game Over overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 30);

      ctx.font = '18px monospace';
      ctx.fillStyle = '#33ff33';
      const msg = this.winner === 'player' ? 'You Win!' : 'AI Wins';
      ctx.fillText(msg, w / 2, h / 2 + 5);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Press any key to exit', w / 2, h / 2 + 30);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
