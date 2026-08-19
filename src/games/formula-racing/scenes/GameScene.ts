import Phaser from "phaser";
import { FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { RACE, RACE_COLORS, CAR_COLS, GRID_COLS } from "../config";
import { CELL } from "../../tetris/config";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
import { DotCar } from "../entities/DotCar";
import { createDPad } from "../../../ui/createDPad";
import { createRoundButton } from "../../../ui/createRoundButton";
import {
  PLAYFIELD_X,
  PLAYFIELD_Y,
  PLAYFIELD_WIDTH,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_BOTTOM,
  DPAD_X,
  DPAD_Y,
  BUTTON_X,
  BUTTON_Y,
} from "../../../ui/controlLayout";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";

const MAX_COL = GRID_COLS - CAR_COLS;

export class GameScene extends Phaser.Scene {
  private player!: DotCar;
  private col = Math.floor(MAX_COL / 2);
  private obstacles: DotCar[] = [];
  private spawnTimer!: Phaser.Time.TimerEvent;
  private elapsedMs = 0;
  private speed = RACE.BASE_SPEED;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private boosting = false;

  constructor() {
    super("FormulaRacing.Game");
  }

  init(): void {
    this.obstacles.length = 0;
    this.col = Math.floor(MAX_COL / 2);
    this.elapsedMs = 0;
    this.speed = RACE.BASE_SPEED;
    this.score = 0;
    this.gameOver = false;
    this.boosting = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.physics.world.setBounds(PLAYFIELD_X, PLAYFIELD_Y, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
    this.drawRoad();
    this.player = this.createPlayer();

    this.physics.add.overlap(this.player, this.obstacles, this.handleCrash, this.hasBlockOverlap, this);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.y < PLAYFIELD_Y || p.y > PLAYFIELD_BOTTOM) return;
      if (p.x < PLAYFIELD_X || p.x > PLAYFIELD_X + PLAYFIELD_WIDTH) return;
      if (p.x < PLAYFIELD_X + PLAYFIELD_WIDTH / 2) this.setCol(this.col - 1);
      else this.setCol(this.col + 1);
    });
    this.input.keyboard?.on("keydown-LEFT", () => this.setCol(this.col - 1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.setCol(this.col + 1));

    this.createControls();
    createPauseButton(this);
    const meta = getGameMeta("formula-racing");
    createInfoButton(this, meta.title, meta.howToPlay);

    this.spawnObstacle();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;
    this.elapsedMs += delta;
    const newScore = Math.floor(this.elapsedMs / 100);
    if (newScore !== this.score) {
      this.score = newScore;
      this.scoreText.setText(`Score: ${this.score}`);
    }
    this.speed = Math.min(RACE.MAX_SPEED, RACE.BASE_SPEED + (this.elapsedMs / 1000) * RACE.SPEED_RAMP_PER_SEC);

    const effectiveSpeed = this.currentSpeed();
    const halfHeight = RACE.OBSTACLE_HEIGHT / 2;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      (obstacle.body as Phaser.Physics.Arcade.Body).setVelocityY(effectiveSpeed);
      obstacle.updateRowVisibility(PLAYFIELD_Y, PLAYFIELD_BOTTOM);
      if (obstacle.y - halfHeight > PLAYFIELD_BOTTOM) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private currentSpeed(): number {
    return this.boosting ? this.speed * RACE.BOOST_MULTIPLIER : this.speed;
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        if (dir === "left") this.setCol(this.col - 1);
        else if (dir === "right") this.setCol(this.col + 1);
      },
    });

    const boostBtn = createRoundButton(this, BUTTON_X, BUTTON_Y, "BOOST", () => {
      this.boosting = true;
    }, 46);
    boostBtn.on("pointerup", () => (this.boosting = false));
    boostBtn.on("pointerout", () => (this.boosting = false));
  }

  private colX(col: number): number {
    return PLAYFIELD_X + col * CELL + RACE.CAR_WIDTH / 2;
  }

  private drawRoad(): void {
    const boxCenterX = PLAYFIELD_X + PLAYFIELD_WIDTH / 2;
    this.scoreText = this.add
      .text(boxCenterX, 40, "Score: 0", { fontFamily: FONT_FAMILY, fontSize: "9px", color: "#545a41" })
      .setOrigin(0.5);
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

  private createPlayer(): DotCar {
    const car = new DotCar(
      this,
      this.colX(this.col),
      PLAYFIELD_BOTTOM - RACE.PLAYER_Y_OFFSET,
      RACE.CAR_WIDTH,
      RACE.CAR_HEIGHT,
      RACE_COLORS.PLAYER
    );
    const body = car.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    return car;
  }

  private setCol(newCol: number): void {
    if (this.gameOver) return;
    sfx.move();
    this.col = Phaser.Math.Clamp(newCol, 0, MAX_COL);
    const x = this.colX(this.col);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(x, this.player.y);
  }

  // Oncoming traffic can appear on any column the player can reach (the
  // full 0..MAX_COL range), not just a handful of fixed lanes — otherwise
  // most of the columns the player can move to are ones traffic never
  // actually uses.
  private spawnObstacle(): void {
    if (this.gameOver) return;
    const col = Phaser.Math.Between(0, MAX_COL);
    const color = Phaser.Utils.Array.GetRandom(RACE_COLORS.OBSTACLES);
    const obstacle = new DotCar(
      this,
      this.colX(col),
      -RACE.OBSTACLE_HEIGHT,
      RACE.OBSTACLE_WIDTH,
      RACE.OBSTACLE_HEIGHT,
      color
    );
    obstacle.updateRowVisibility(PLAYFIELD_Y, PLAYFIELD_BOTTOM);
    const body = obstacle.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.currentSpeed());
    this.obstacles.push(obstacle);

    const spawnMs = Math.max(RACE.MIN_SPAWN_MS, RACE.BASE_SPAWN_MS - (this.elapsedMs / 1000) * RACE.SPAWN_RAMP_MS_PER_SEC);
    this.spawnTimer = this.time.addEvent({ delay: spawnMs, callback: () => this.spawnObstacle() });
  }

  // The two cars' bodies are their full 3x4-cell bounding boxes, but the dot
  // pattern inside is sparse (1-3-1-3), so a raw AABB overlap would crash
  // the game on a graze of empty space between squares. Only count it as a
  // crash once one of the player's actual visible squares overlaps one of
  // the obstacle's.
  private hasBlockOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (obj1, obj2) => {
    const blocksA = (obj1 as DotCar).getVisibleBlockRects();
    const blocksB = (obj2 as DotCar).getVisibleBlockRects();
    return blocksA.some((a) => blocksB.some((b) => Phaser.Geom.Rectangle.Overlaps(a, b)));
  };

  private handleCrash: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () => {
    if (this.gameOver) return;
    this.gameOver = true;
    this.spawnTimer?.remove();
    this.physics.pause();
    sfx.gameOver();
    // Freezing physics still leaves the crashed frame on screen — cars
    // caught mid-overlap — until the async save below resolves and the
    // Game Over scene loads. Fade out immediately so that frame is never
    // actually visible, instead of lingering on two cars stuck together.
    const bg = Phaser.Display.Color.IntegerToColor(APP_COLORS.BACKGROUND);
    this.cameras.main.fadeOut(150, bg.red, bg.green, bg.blue);
    this.endGame();
  };

  private async endGame(): Promise<void> {
    const fadeDone = new Promise<void>((resolve) => {
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
    });
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["formula-racing"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, "formula-racing": highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    await fadeDone;
    this.scene.start("FormulaRacing.GameOver", { score: this.score, highScore });
  }
}
