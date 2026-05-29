type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

/**
 * Snake game that renders on the terminal canvas.
 * Grid is sized to fit the terminal dimensions.
 */
export class SnakeGame {
  private active = false;
  private gridW = 0;
  private gridH = 0;
  private snake: Point[] = [];
  private food: Point = { x: 0, y: 0 };
  private dir: Direction = 'right';
  private nextDir: Direction = 'right';
  private score = 0;
  private tickRate = 120; // ms per move
  private lastTick = 0;
  private gameOver = false;
  private onExit: () => void;

  constructor(onExit: () => void) {
    this.onExit = onExit;
  }

  start(gridW: number, gridH: number): void {
    this.active = true;
    this.gameOver = false;
    this.score = 0;
    this.gridW = gridW;
    this.gridH = gridH;
    this.snake = [
      { x: Math.floor(gridW / 4), y: Math.floor(gridH / 2) },
      { x: Math.floor(gridW / 4) - 1, y: Math.floor(gridH / 2) },
      { x: Math.floor(gridW / 4) - 2, y: Math.floor(gridH / 2) },
    ];
    this.dir = 'right';
    this.nextDir = 'right';
    this.placeFood();
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  handleKey(key: string): void {
    if (!this.active) return;
    if (this.gameOver) {
      this.onExit();
      return;
    }

    const opposites: Record<string, string> = {
      up: 'down', down: 'up', left: 'right', right: 'left',
    };

    const map: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };

    if (map[key]) {
      const d = map[key];
      if (opposites[d] !== this.dir) {
        this.nextDir = d;
      }
    }
  }

  update(time: number): void {
    if (!this.active || this.gameOver) return;

    if (time - this.lastTick > this.tickRate) {
      this.lastTick = time;
      this.tick();
    }
  }

  private tick(): void {
    this.dir = this.nextDir;
    const head = { ...this.snake[0] };

    switch (this.dir) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // Wrap around
    if (head.x < 0) head.x = this.gridW - 1;
    if (head.x >= this.gridW) head.x = 0;
    if (head.y < 0) head.y = this.gridH - 1;
    if (head.y >= this.gridH) head.y = 0;

    // Self collision
    if (this.snake.some((s) => s.x === head.x && s.y === head.y)) {
      this.gameOver = true;
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.tickRate = Math.max(60, this.tickRate - 2);
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  private placeFood(): void {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.gridW),
        y: Math.floor(Math.random() * this.gridH),
      };
    } while (this.snake.some((s) => s.x === this.food.x && s.y === this.food.y));
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;

    const cellW = w / this.gridW;
    const cellH = h / this.gridH;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(51, 255, 51, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.gridW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, h);
      ctx.stroke();
    }
    for (let y = 0; y <= this.gridH; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(w, y * cellH);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.food.x * cellW + 1, this.food.y * cellH + 1, cellW - 2, cellH - 2);
    ctx.shadowBlur = 0;

    // Snake
    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const brightness = 1 - (i / this.snake.length) * 0.5;
      ctx.fillStyle = `rgba(51, 255, 51, ${brightness})`;
      ctx.fillRect(seg.x * cellW + 1, seg.y * cellH + 1, cellW - 2, cellH - 2);
    }

    // Score
    ctx.fillStyle = '#33ff33';
    ctx.font = '14px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${this.score}`, 8, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('Ctrl+C to quit', 8, 26);

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#33ff33';
      ctx.fillText(`Final Score: ${this.score}`, w / 2, h / 2 + 10);
      ctx.fillText('Press any key to exit', w / 2, h / 2 + 30);
      ctx.textAlign = 'left';
    }
  }
}
