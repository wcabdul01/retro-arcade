import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { COLS, ROWS, CELL, TIMING, SNAKE_COLORS } from "../config";
import { getPlatformAdapter } from "../../../platform";
import { createDPad } from "../../../ui/createDPad";
import { sfx } from "../../../systems/SoundManager";
import { DPAD_X, DPAD_Y, PLAYFIELD_X, PLAYFIELD_Y, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT } from "../../../ui/controlLayout";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";

// Frame matches Brick Breaker's box exactly; the grid (which may not fill it
// exactly, since COLS/ROWS are fixed) is centered inside via GRID_X/GRID_Y.
const GRID_X = PLAYFIELD_X + (PLAYFIELD_WIDTH - COLS * CELL) / 2;
const GRID_Y = PLAYFIELD_Y + (PLAYFIELD_HEIGHT - ROWS * CELL) / 2;

interface Point {
  x: number;
  y: number;
}

export class GameScene extends Phaser.Scene {
  private snake: Point[] = [];
  private direction: Point = { x: 1, y: 0 };
  private pendingDirection: Point = { x: 1, y: 0 };
  private food: Point = { x: 0, y: 0 };
  private segmentRects: Phaser.GameObjects.Rectangle[] = [];
  private foodRect!: Phaser.GameObjects.Rectangle;
  private tickTimer!: Phaser.Time.TimerEvent;
  private tickMs = TIMING.BASE_TICK_MS;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOver = false;

  constructor() {
    super("Snake.Game");
  }

  init(): void {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = { x: 1, y: 0 };
    this.pendingDirection = { x: 1, y: 0 };
    this.tickMs = TIMING.BASE_TICK_MS;
    this.score = 0;
    this.gameOver = false;
    this.segmentRects = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.drawFrame();
    this.spawnFood();
    this.redraw();

    this.tickTimer = this.time.addEvent({ delay: this.tickMs, loop: true, callback: () => this.tick() });

    this.input.keyboard?.on("keydown-LEFT", () => {
      sfx.move();
      this.setDirection(-1, 0);
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      sfx.move();
      this.setDirection(1, 0);
    });
    this.input.keyboard?.on("keydown-UP", () => {
      sfx.move();
      this.setDirection(0, -1);
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      sfx.move();
      this.setDirection(0, 1);
    });

    this.createControls();
    createPauseButton(this);
    const meta = getGameMeta("snake");
    createInfoButton(this, meta.title, meta.howToPlay);
  }

  private drawFrame(): void {
    this.add
      .rectangle(
        PLAYFIELD_X + PLAYFIELD_WIDTH / 2,
        PLAYFIELD_Y + PLAYFIELD_HEIGHT / 2,
        PLAYFIELD_WIDTH + 4,
        PLAYFIELD_HEIGHT + 4,
        0x000000,
        0
      )
      .setStrokeStyle(2, APP_COLORS.ACCENT);
    this.scoreText = this.add
      .text(GAME_WIDTH / 2, 40, "Score: 0", { fontFamily: FONT_FAMILY, fontSize: "10px", color: "#545a41" })
      .setOrigin(0.5);
    this.foodRect = this.add.rectangle(0, 0, CELL - 2, CELL - 2, SNAKE_COLORS.FOOD);
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        if (dir === "up") this.setDirection(0, -1);
        else if (dir === "down") this.setDirection(0, 1);
        else if (dir === "left") this.setDirection(-1, 0);
        else this.setDirection(1, 0);
      },
    });
  }

  private setDirection(dx: number, dy: number): void {
    if (this.gameOver) return;
    if (dx === -this.direction.x && dy === -this.direction.y) return;
    this.pendingDirection = { x: dx, y: dy };
  }

  private tick(): void {
    if (this.gameOver) return;
    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const newHead: Point = { x: head.x + this.direction.x, y: head.y + this.direction.y };

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      this.endGame();
      return;
    }
    if (this.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      sfx.score();
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
      this.spawnFood();
      this.tickMs = Math.max(TIMING.MIN_TICK_MS, this.tickMs - TIMING.TICK_STEP_MS);
      this.tickTimer.remove();
      this.tickTimer = this.time.addEvent({ delay: this.tickMs, loop: true, callback: () => this.tick() });
    } else {
      this.snake.pop();
    }
    this.redraw();
  }

  private spawnFood(): void {
    let candidate: Point;
    do {
      candidate = { x: Phaser.Math.Between(0, COLS - 1), y: Phaser.Math.Between(0, ROWS - 1) };
    } while (this.snake.some((seg) => seg.x === candidate.x && seg.y === candidate.y));
    this.food = candidate;
    this.foodRect.setPosition(GRID_X + this.food.x * CELL + CELL / 2, GRID_Y + this.food.y * CELL + CELL / 2);
  }

  private redraw(): void {
    this.snake.forEach((seg, i) => {
      let rect = this.segmentRects[i];
      if (!rect) {
        rect = this.add.rectangle(0, 0, CELL - 2, CELL - 2, SNAKE_COLORS.BODY);
        this.segmentRects.push(rect);
      }
      rect.setPosition(GRID_X + seg.x * CELL + CELL / 2, GRID_Y + seg.y * CELL + CELL / 2);
      rect.setFillStyle(i === 0 ? SNAKE_COLORS.HEAD : SNAKE_COLORS.BODY);
    });
  }

  private async endGame(): Promise<void> {
    this.gameOver = true;
    this.tickTimer.remove();
    sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["snake"] ?? 0, this.score);
    const updated = { ...saved, highScores: { ...saved.highScores, snake: highScore } };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("Snake.GameOver", { score: this.score, highScore });
  }
}
