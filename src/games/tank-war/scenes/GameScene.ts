import Phaser from "phaser";
import { FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { ARENA, BULLET, GAMEPLAY, TW_COLORS } from "../config";
import { LEVEL_COUNT, generateWallLayout, enemyCountForLevel, enemySpawnCols, enemySpeedForLevel } from "../data/levels";
import { Tank, Direction } from "../entities/Tank";
import { Bullet } from "../entities/Bullet";
import { Wall } from "../entities/Wall";
import { getPlatformAdapter } from "../../../platform";
import { createDPad } from "../../../ui/createDPad";
import { createRoundButton } from "../../../ui/createRoundButton";
import { sfx } from "../../../systems/SoundManager";
import {
  DPAD_X,
  DPAD_Y,
  BUTTON_X,
  BUTTON_Y,
  PLAYFIELD_X,
  PLAYFIELD_Y,
  PLAYFIELD_WIDTH,
  PLAYFIELD_HEIGHT,
} from "../../../ui/controlLayout";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";

// Frame matches Brick Breaker's box exactly; the arena grid (which may not
// fill it exactly, since ARENA.COLS/ROWS are fixed) is centered inside via
// GRID_X/GRID_Y.
const GRID_X = PLAYFIELD_X + (PLAYFIELD_WIDTH - ARENA.COLS * ARENA.CELL) / 2;
const GRID_Y = PLAYFIELD_Y + (PLAYFIELD_HEIGHT - ARENA.ROWS * ARENA.CELL) / 2;

function cellToX(col: number): number {
  return GRID_X + col * ARENA.CELL + ARENA.CELL / 2;
}

function cellToY(row: number): number {
  return GRID_Y + row * ARENA.CELL + ARENA.CELL / 2;
}

interface GameSceneData {
  levelIndex?: number;
  score?: number;
  lives?: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Tank;
  private enemies: Tank[] = [];
  private walls: Wall[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private enemyTimers: Phaser.Time.TimerEvent[] = [];
  private lastPlayerFire = 0;
  private touchDirection: Direction | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private levelIndex = 0;
  private score = 0;
  private lives = GAMEPLAY.START_LIVES;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private ending = false;

  constructor() {
    super("TankWar.Game");
  }

  init(data: GameSceneData): void {
    this.walls.length = 0;
    this.enemies.length = 0;
    this.playerBullets.length = 0;
    this.enemyBullets.length = 0;
    this.enemyTimers.forEach((t) => t.remove());
    this.enemyTimers = [];
    this.lastPlayerFire = 0;
    this.touchDirection = null;
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? GAMEPLAY.START_LIVES;
    this.gameOver = false;
    this.ending = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.physics.world.setBounds(GRID_X, GRID_Y, ARENA.COLS * ARENA.CELL, ARENA.ROWS * ARENA.CELL);
    this.drawHeader();
    this.buildWalls();

    const startCol = Math.floor(ARENA.COLS / 2);
    this.player = new Tank(this, cellToX(startCol), cellToY(ARENA.ROWS - 1), TW_COLORS.PLAYER);

    this.spawnEnemies();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.collider(this.playerBullets, this.walls, this.handleBulletWallHit, undefined, this);
    this.physics.add.collider(this.enemyBullets, this.walls, this.handleBulletWallHit, undefined, this);
    this.physics.add.collider(this.playerBullets, this.enemies, this.handlePlayerBulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.handleEnemyBulletHitPlayer, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.createControls();
    createPauseButton(this);
    const meta = getGameMeta("tank-war");
    createInfoButton(this, meta.title, meta.howToPlay);
  }

  update(): void {
    if (this.gameOver) return;
    let dir: Direction | null = this.touchDirection;
    if (!dir) {
      if (this.cursors.left.isDown) dir = "left";
      else if (this.cursors.right.isDown) dir = "right";
      else if (this.cursors.up.isDown) dir = "up";
      else if (this.cursors.down.isDown) dir = "down";
    }
    this.player.setVelocityDir(dir);

    if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      this.tryFire();
    }

    const arenaLeft = GRID_X;
    const arenaRight = GRID_X + ARENA.COLS * ARENA.CELL;
    const arenaTop = GRID_Y;
    const arenaBottom = GRID_Y + ARENA.ROWS * ARENA.CELL;
    this.player.clampToBounds(arenaLeft, arenaRight, arenaTop, arenaBottom);
    this.enemies.forEach((enemy) => {
      enemy.clampToBounds(arenaLeft, arenaRight, arenaTop, arenaBottom);
      if (enemy.isStopped()) {
        const free = enemy.freeDirections();
        const dir = free.length > 0 ? Phaser.Utils.Array.GetRandom(free) : this.randomDir();
        enemy.setVelocityDir(dir);
      }
    });

    const left = GRID_X - 10;
    const right = GRID_X + ARENA.COLS * ARENA.CELL + 10;
    const top = GRID_Y - 10;
    const bottom = GRID_Y + ARENA.ROWS * ARENA.CELL + 10;
    [...this.playerBullets, ...this.enemyBullets].forEach((b) => {
      if (b.x < left || b.x > right || b.y < top || b.y > bottom) {
        this.removeBullet(b);
      }
    });
  }

  private drawHeader(): void {
    const boxCenterX = PLAYFIELD_X + PLAYFIELD_WIDTH / 2;
    this.add
      .text(boxCenterX, 32, `Level ${this.levelIndex + 1}/${LEVEL_COUNT}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "8px",
        color: "#545a41",
      })
      .setOrigin(0.5);
    this.scoreText = this.add.text(PLAYFIELD_X, 48, `Score: ${this.score}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "9px",
      color: "#16170f",
    });
    this.livesText = this.add
      .text(PLAYFIELD_X + PLAYFIELD_WIDTH, 48, `Lives: ${this.lives}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "9px",
        color: "#16170f",
      })
      .setOrigin(1, 0);
    this.add
      .rectangle(boxCenterX, PLAYFIELD_Y + PLAYFIELD_HEIGHT / 2, PLAYFIELD_WIDTH + 4, PLAYFIELD_HEIGHT + 4, 0x000000, 0)
      .setStrokeStyle(2, APP_COLORS.ACCENT);
  }

  private buildWalls(): void {
    const layout = generateWallLayout(this.levelIndex);
    layout.forEach((rowStr, row) => {
      for (let col = 0; col < ARENA.COLS; col++) {
        if (rowStr[col] === "X") {
          this.walls.push(new Wall(this, cellToX(col), cellToY(row)));
        }
      }
    });
  }

  private spawnEnemies(): void {
    const count = enemyCountForLevel(this.levelIndex);
    const cols = enemySpawnCols(count);
    const speed = enemySpeedForLevel(this.levelIndex);
    cols.forEach((col) => {
      const enemy = new Tank(this, cellToX(col), cellToY(0), TW_COLORS.ENEMY, speed);
      enemy.setVelocityDir(this.randomDir());
      this.enemies.push(enemy);
      this.scheduleEnemyDirectionChange(enemy);
      this.scheduleEnemyFire(enemy);
    });
  }

  private randomDir(): Direction {
    const dirs: Direction[] = ["up", "down", "left", "right"];
    return Phaser.Utils.Array.GetRandom(dirs);
  }

  private scheduleEnemyDirectionChange(enemy: Tank): void {
    const delay = Phaser.Math.Between(GAMEPLAY.ENEMY_DIR_CHANGE_MIN_MS, GAMEPLAY.ENEMY_DIR_CHANGE_MAX_MS);
    const timer = this.time.addEvent({
      delay,
      callback: () => {
        if (this.gameOver || !this.enemies.includes(enemy)) return;
        enemy.setVelocityDir(this.randomDir());
        this.scheduleEnemyDirectionChange(enemy);
      },
    });
    this.enemyTimers.push(timer);
  }

  private scheduleEnemyFire(enemy: Tank): void {
    const minMs = Math.max(500, BULLET.ENEMY_FIRE_MIN_MS - this.levelIndex * 100);
    const maxMs = Math.max(1000, BULLET.ENEMY_FIRE_MAX_MS - this.levelIndex * 150);
    const delay = Phaser.Math.Between(minMs, maxMs);
    const timer = this.time.addEvent({
      delay,
      callback: () => {
        if (this.gameOver || !this.enemies.includes(enemy)) return;
        const bullet = new Bullet(this, enemy.x, enemy.y, enemy.facing, "enemy");
        this.enemyBullets.push(bullet);
        this.scheduleEnemyFire(enemy);
      },
    });
    this.enemyTimers.push(timer);
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        this.touchDirection = dir;
      },
      onRelease: (dir) => {
        if (this.touchDirection === dir) this.touchDirection = null;
      },
    });

    createRoundButton(this, BUTTON_X, BUTTON_Y, "FIRE", () => this.tryFire(), 46);
  }

  private tryFire(): void {
    if (this.gameOver) return;
    const now = this.time.now;
    if (now - this.lastPlayerFire < BULLET.PLAYER_COOLDOWN_MS) return;
    this.lastPlayerFire = now;
    sfx.shoot();
    const bullet = new Bullet(this, this.player.x, this.player.y, this.player.facing, "player");
    this.playerBullets.push(bullet);
  }

  private removeBullet(bullet: Bullet): void {
    const arr = bullet.owner === "player" ? this.playerBullets : this.enemyBullets;
    const idx = arr.indexOf(bullet);
    if (idx >= 0) arr.splice(idx, 1);
    bullet.destroy();
  }

  private handleBulletWallHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObj, wallObj) => {
    const bullet = bulletObj as unknown as Bullet;
    const wall = wallObj as unknown as Wall;
    this.removeBullet(bullet);
    sfx.hit();
    const idx = this.walls.indexOf(wall);
    if (idx >= 0) this.walls.splice(idx, 1);
    wall.destroy();
  };

  private handlePlayerBulletHitEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObj, enemyObj) => {
    if (this.ending) return;
    const bullet = bulletObj as unknown as Bullet;
    const enemy = enemyObj as unknown as Tank;
    this.removeBullet(bullet);
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) this.enemies.splice(idx, 1);
    enemy.destroy();
    sfx.score();
    this.score += GAMEPLAY.ENEMY_SCORE;
    this.scoreText.setText(`Score: ${this.score}`);
    if (this.enemies.length === 0) {
      this.onLevelClear();
    }
  };

  private handleEnemyBulletHitPlayer: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObj) => {
    if (this.ending) return;
    const bullet = bulletObj as unknown as Bullet;
    this.removeBullet(bullet);
    sfx.hurt();
    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);
    if (this.lives <= 0) {
      this.endGame(false);
    }
  };

  private onLevelClear(): void {
    this.ending = true;
    this.gameOver = true;
    this.enemyTimers.forEach((t) => t.remove());
    const nextIndex = this.levelIndex + 1;
    if (nextIndex >= LEVEL_COUNT) {
      this.endGame(true);
      return;
    }
    this.physics.pause();
    sfx.win();
    this.time.delayedCall(1200, () => {
      this.scene.restart({ levelIndex: nextIndex, score: this.score, lives: this.lives });
    });
  }

  private async endGame(win: boolean): Promise<void> {
    this.gameOver = true;
    this.ending = true;
    this.enemyTimers.forEach((t) => t.remove());
    this.physics.pause();
    if (win) sfx.win();
    else sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["tank-war"] ?? 0, this.score);
    const updated = { ...saved, highScores: { ...saved.highScores, "tank-war": highScore } };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("TankWar.GameOver", { win, score: this.score, highScore, levelIndex: this.levelIndex });
  }
}
