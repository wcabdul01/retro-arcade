import Phaser from "phaser";
import { COLORS as APP_COLORS } from "../../../config/AppConfig";
import { BALL, BRICK, BB_COLORS, PADDLE } from "../config";
import { Paddle } from "../entities/Paddle";
import { Ball } from "../entities/Ball";
import { Brick } from "../entities/Brick";
import { PowerUp } from "../entities/PowerUp";
import { LEVEL_COUNT, generateLevel, charToBrickType } from "../data/levels";
import { PowerUpManager } from "../systems/PowerUpManager";
import { ScoreManager } from "../systems/ScoreManager";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
import { createDPad } from "../../../ui/createDPad";
import { createRoundButton } from "../../../ui/createRoundButton";
import {
  PLAYFIELD_X,
  PLAYFIELD_Y,
  PLAYFIELD_WIDTH,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_RIGHT,
  PLAYFIELD_BOTTOM,
  DPAD_X,
  DPAD_Y,
  BUTTON_X,
  BUTTON_Y,
} from "../../../ui/controlLayout";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";

interface GameSceneData {
  levelIndex?: number;
  scoreManager?: ScoreManager;
}

export class GameScene extends Phaser.Scene {
  private paddle!: Paddle;
  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private powerUpManager!: PowerUpManager;
  private scoreManager!: ScoreManager;
  private levelIndex = 0;
  private destructibleRemaining = 0;
  private ending = false;

  constructor() {
    super("BrickBreaker.Game");
  }

  init(data: GameSceneData): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.balls = [];
    this.bricks = [];
    this.ending = false;
    if (data.scoreManager) {
      this.scoreManager = data.scoreManager;
      this.scoreManager.setLevel(this.levelIndex);
    } else {
      this.scoreManager = new ScoreManager();
      this.scoreManager.reset(this.levelIndex);
    }
  }

  create(): void {
    this.physics.world.setBounds(PLAYFIELD_X, PLAYFIELD_Y, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.drawFrame();

    this.paddle = new Paddle(this, PLAYFIELD_X + PLAYFIELD_WIDTH / 2, PLAYFIELD_BOTTOM - PADDLE.Y_OFFSET);
    this.spawnStuckBall();
    this.buildLevel(this.levelIndex);

    this.powerUpManager = new PowerUpManager({
      scene: this,
      paddle: this.paddle,
      getBalls: () => this.balls,
      spawnBall: (x, y) => this.spawnBall(x, y),
      scoreManager: this.scoreManager,
    });

    this.physics.add.collider(this.balls, this.paddle, this.handlePaddleHit, undefined, this);
    this.physics.add.collider(this.balls, this.bricks, this.handleBrickHit, undefined, this);
    this.physics.add.overlap(this.paddle, this.powerUpManager.powerUps, this.handlePowerUpCatch, undefined, this);

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.paddle.moveTo(pointer.x);
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.paddle.moveTo(pointer.x);
      this.launchStuckBalls();
    });
    this.input.keyboard?.on("keydown-LEFT", () => this.paddle.moveTo(this.paddle.x - 40));
    this.input.keyboard?.on("keydown-RIGHT", () => this.paddle.moveTo(this.paddle.x + 40));
    this.input.keyboard?.on("keydown-SPACE", () => this.launchStuckBalls());

    this.createControls();
    createPauseButton(this, { uiSceneKey: "BrickBreaker.UI" });
    const meta = getGameMeta("brick-breaker");
    createInfoButton(this, meta.title, meta.howToPlay);

    this.scene.launch("BrickBreaker.UI", { scoreManager: this.scoreManager });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.powerUpManager.destroy();
    });
  }

  update(): void {
    if (this.ending) return;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (ball.stuck) {
        ball.followPaddle(this.paddle);
      } else {
        ball.clampToPlayfield(PLAYFIELD_X, PLAYFIELD_RIGHT, PLAYFIELD_Y);
        if (ball.y - BALL.RADIUS > PLAYFIELD_BOTTOM) {
          this.handleBallLost(ball);
        }
      }
    }
    this.powerUpManager.update(PLAYFIELD_BOTTOM);
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
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        if (dir === "left") this.paddle.moveTo(this.paddle.x - 40);
        else if (dir === "right") this.paddle.moveTo(this.paddle.x + 40);
      },
    });
    createRoundButton(this, BUTTON_X, BUTTON_Y, "GO", () => this.launchStuckBalls(), 46);
  }

  private buildLevel(index: number): void {
    const level = generateLevel(index);
    const totalWidth = level.cols * BRICK.WIDTH + (level.cols - 1) * BRICK.PADDING;
    const offsetLeft = PLAYFIELD_X + (PLAYFIELD_WIDTH - totalWidth) / 2;
    this.destructibleRemaining = 0;

    level.rows.forEach((rowStr, rowIndex) => {
      for (let col = 0; col < level.cols; col++) {
        const type = charToBrickType(rowStr[col] ?? ".");
        if (!type) continue;
        const x = offsetLeft + col * (BRICK.WIDTH + BRICK.PADDING) + BRICK.WIDTH / 2;
        const y = PLAYFIELD_Y + BRICK.OFFSET_TOP + rowIndex * (BRICK.HEIGHT + BRICK.PADDING) + BRICK.HEIGHT / 2;
        const brick = new Brick(this, x, y, BRICK.WIDTH, BRICK.HEIGHT);
        const rowColor = BB_COLORS.BRICK_ROWS[rowIndex % BB_COLORS.BRICK_ROWS.length];
        brick.configure(type, rowColor);
        this.bricks.push(brick);
        if (type !== "indestructible") {
          this.destructibleRemaining += 1;
        }
      }
    });
  }

  private spawnBall(x: number, y: number): Ball {
    const ball = new Ball(this, x, y);
    this.balls.push(ball);
    return ball;
  }

  private spawnStuckBall(): void {
    const y = this.paddle.y - this.paddle.height / 2 - BALL.RADIUS - 4;
    const ball = this.spawnBall(this.paddle.x, y);
    ball.stickTo(this.paddle);
  }

  private launchStuckBalls(): void {
    this.balls.filter((b) => b.stuck).forEach((b) => b.launch());
  }

  private handlePaddleHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (ballObj) => {
    const ball = ballObj as unknown as Ball;
    if (ball.stuck) return;
    sfx.hit();
    if (this.paddle.isSticky) {
      ball.stickTo(this.paddle);
    } else {
      ball.reflectOffPaddle(this.paddle);
    }
  };

  private handleBrickHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_ballObj, brickObj) => {
    const brick = brickObj as unknown as Brick;
    const destroyed = brick.hit();
    if (destroyed) {
      sfx.score();
      this.scoreManager.addScore(brick.scoreValue);
      this.powerUpManager.maybeDrop(brick.x, brick.y);
      const idx = this.bricks.indexOf(brick);
      if (idx >= 0) this.bricks.splice(idx, 1);
      brick.destroy();
      this.destructibleRemaining -= 1;
      if (this.destructibleRemaining <= 0 && !this.ending) {
        this.onLevelClear();
      }
    }
  };

  private handlePowerUpCatch: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_paddleObj, powerUpObj) => {
    const powerUp = powerUpObj as unknown as PowerUp;
    this.powerUpManager.collect(powerUp);
  };

  private handleBallLost(ball: Ball): void {
    const idx = this.balls.indexOf(ball);
    if (idx >= 0) this.balls.splice(idx, 1);
    ball.destroy();
    if (this.balls.length > 0) return;
    sfx.hurt();
    const isGameOver = this.scoreManager.loseLife();
    if (isGameOver) {
      this.endGame(false);
      return;
    }
    this.spawnStuckBall();
  }

  private onLevelClear(): void {
    this.ending = true;
    this.physics.pause();
    sfx.lineClear();
    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= LEVEL_COUNT) {
      this.endGame(true);
      return;
    }
    this.time.delayedCall(1200, () => {
      this.scene.restart({ levelIndex: nextIndex, scoreManager: this.scoreManager });
    });
  }

  private async endGame(win: boolean): Promise<void> {
    this.ending = true;
    this.physics.pause();
    if (win) sfx.win();
    else sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["brick-breaker"] ?? 0, this.scoreManager.score);
    const unlockedLevel = Math.max(
      (saved.progress["brick-breaker"] as number | undefined) ?? 0,
      Math.min(this.levelIndex + 1, LEVEL_COUNT - 1)
    );
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, "brick-breaker": highScore },
      progress: { ...saved.progress, "brick-breaker": unlockedLevel },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.stop("BrickBreaker.UI");
    this.scene.start("BrickBreaker.GameOver", {
      win,
      score: this.scoreManager.score,
      highScore,
      levelIndex: this.levelIndex,
    });
  }
}
