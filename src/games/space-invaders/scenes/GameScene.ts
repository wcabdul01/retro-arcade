import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS as APP_COLORS, CONTENT_MARGIN } from "../../../config/AppConfig";
import { FLEET, PLAYER, BULLET, SI_COLORS, GAMEPLAY } from "../config";
import { Player } from "../entities/Player";
import { Invader } from "../entities/Invader";
import { Bullet } from "../entities/Bullet";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
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

interface GameSceneData {
  score?: number;
  wave?: number;
  lives?: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private invaders: Invader[] = [];
  private playerBullets: Bullet[] = [];
  private invaderBullets: Bullet[] = [];
  private fleetDir = 1;
  private stepMs = FLEET.MAX_STEP_MS;
  private stepTimer!: Phaser.Time.TimerEvent;
  private fireTimer!: Phaser.Time.TimerEvent;
  private lastPlayerFire = 0;
  private score = 0;
  private lives = GAMEPLAY.START_LIVES;
  private wave = 1;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gameOver = false;

  constructor() {
    super("SpaceInvaders.Game");
  }

  init(data: GameSceneData): void {
    this.invaders.length = 0;
    this.playerBullets.length = 0;
    this.invaderBullets.length = 0;
    this.fleetDir = 1;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? GAMEPLAY.START_LIVES;
    this.wave = data.wave ?? 1;
    this.gameOver = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.physics.world.setBounds(PLAYFIELD_X, PLAYFIELD_Y, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);
    this.drawHeader();
    this.drawFrame();
    this.player = new Player(this, PLAYFIELD_X + PLAYFIELD_WIDTH / 2, PLAYFIELD_BOTTOM - PLAYER.Y_OFFSET);
    this.spawnWave();

    this.physics.add.collider(this.playerBullets, this.invaders, this.handleInvaderHit, undefined, this);
    this.physics.add.overlap(this.invaderBullets, this.player, this.handlePlayerHit, undefined, this);

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.player.moveTo(p.x));
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.player.moveTo(p.x);
      this.tryFire();
    });
    this.input.keyboard?.on("keydown-LEFT", () => this.player.moveTo(this.player.x - 30));
    this.input.keyboard?.on("keydown-RIGHT", () => this.player.moveTo(this.player.x + 30));
    this.input.keyboard?.on("keydown-SPACE", () => this.tryFire());

    this.createControls();
    createPauseButton(this);
    const meta = getGameMeta("space-invaders");
    createInfoButton(this, meta.title, meta.howToPlay);

    this.fireTimer = this.time.addEvent({
      delay: BULLET.INVADER_FIRE_INTERVAL_MS,
      loop: true,
      callback: () => this.invaderFire(),
    });
  }

  update(): void {
    if (this.gameOver) return;
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      if (b.y < PLAYFIELD_Y) this.removeBullet(b);
    }
    for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
      const b = this.invaderBullets[i];
      if (b.y > PLAYFIELD_BOTTOM) this.removeBullet(b);
    }
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        if (dir === "left") this.player.moveTo(this.player.x - 30);
        else if (dir === "right") this.player.moveTo(this.player.x + 30);
      },
    });
    createRoundButton(this, BUTTON_X, BUTTON_Y, "FIRE", () => this.tryFire(), 46);
  }

  private drawHeader(): void {
    this.scoreText = this.add.text(CONTENT_MARGIN, CONTENT_MARGIN, `Score: ${this.score}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "9px",
      color: "#16170f",
    });
    this.livesText = this.add
      .text(GAME_WIDTH - CONTENT_MARGIN, 56, `Lives: ${this.lives}`, { fontFamily: FONT_FAMILY, fontSize: "9px", color: "#16170f" })
      .setOrigin(1, 0);
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

  private waveMaxStepMs(): number {
    return Math.max(350, FLEET.MAX_STEP_MS - (this.wave - 1) * 50);
  }

  private spawnWave(): void {
    this.invaders.forEach((inv) => inv.destroy());
    this.invaders.length = 0;
    const fleetWidth = FLEET.COLS * FLEET.CELL_W;
    const left = PLAYFIELD_X + (PLAYFIELD_WIDTH - fleetWidth) / 2;
    for (let row = 0; row < FLEET.ROWS; row++) {
      for (let col = 0; col < FLEET.COLS; col++) {
        const x = left + col * FLEET.CELL_W + FLEET.CELL_W / 2;
        const y = PLAYFIELD_Y + FLEET.TOP_OFFSET + row * FLEET.CELL_H + FLEET.CELL_H / 2;
        const invader = new Invader(this, x, y, row, SI_COLORS.ROWS[row % SI_COLORS.ROWS.length]);
        this.invaders.push(invader);
      }
    }
    this.fleetDir = 1;
    this.stepMs = this.waveMaxStepMs();
    this.restartStepTimer();
  }

  private restartStepTimer(): void {
    this.stepTimer?.remove();
    this.stepTimer = this.time.addEvent({ delay: this.stepMs, loop: true, callback: () => this.stepFleet() });
  }

  private stepFleet(): void {
    if (this.gameOver || this.invaders.length === 0) return;
    const xs = this.invaders.map((i) => i.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    let dx = this.fleetDir * FLEET.STEP_X;
    let dy = 0;
    const willHitRight = maxX + dx > PLAYFIELD_X + PLAYFIELD_WIDTH - FLEET.CELL_W / 2;
    const willHitLeft = minX + dx < PLAYFIELD_X + FLEET.CELL_W / 2;
    if (willHitRight || willHitLeft) {
      this.fleetDir *= -1;
      dx = 0;
      dy = FLEET.STEP_DOWN;
    }
    this.invaders.forEach((inv) => inv.moveBy(dx, dy));

    const maxY = Math.max(...this.invaders.map((i) => i.y));
    if (maxY >= this.player.y - 40) {
      this.endGame();
      return;
    }

    const total = FLEET.ROWS * FLEET.COLS;
    const ratio = this.invaders.length / total;
    const maxStep = this.waveMaxStepMs();
    const newStepMs = Math.round(FLEET.MIN_STEP_MS + (maxStep - FLEET.MIN_STEP_MS) * ratio);
    if (newStepMs !== this.stepMs) {
      this.stepMs = newStepMs;
      this.restartStepTimer();
    }
  }

  private invaderFire(): void {
    if (this.gameOver || this.invaders.length === 0) return;
    if (this.invaderBullets.length >= BULLET.MAX_INVADER_BULLETS) return;
    const shooter = Phaser.Utils.Array.GetRandom(this.invaders);
    const bullet = new Bullet(this, shooter.x, shooter.y + FLEET.CELL_H / 2, "invader");
    this.invaderBullets.push(bullet);
  }

  private tryFire(): void {
    if (this.gameOver) return;
    const now = this.time.now;
    if (now - this.lastPlayerFire < BULLET.PLAYER_COOLDOWN_MS) return;
    this.lastPlayerFire = now;
    sfx.shoot();
    const bullet = new Bullet(this, this.player.x, this.player.y - PLAYER.HEIGHT / 2 - 8, "player");
    this.playerBullets.push(bullet);
  }

  private removeBullet(bullet: Bullet): void {
    const arr = bullet.owner === "player" ? this.playerBullets : this.invaderBullets;
    const idx = arr.indexOf(bullet);
    if (idx >= 0) arr.splice(idx, 1);
    bullet.destroy();
  }

  private handleInvaderHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObj, invaderObj) => {
    const bullet = bulletObj as unknown as Bullet;
    const invader = invaderObj as unknown as Invader;
    this.removeBullet(bullet);
    const idx = this.invaders.indexOf(invader);
    if (idx >= 0) this.invaders.splice(idx, 1);
    sfx.score();
    this.score += invader.scoreValue;
    this.scoreText.setText(`Score: ${this.score}`);
    invader.destroy();
    if (this.invaders.length === 0) {
      this.wave += 1;
      this.time.delayedCall(1000, () => this.spawnWave());
    }
  };

  private handlePlayerHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObj) => {
    const bullet = bulletObj as unknown as Bullet;
    this.removeBullet(bullet);
    sfx.hurt();
    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);
    if (this.lives <= 0) {
      this.endGame();
    }
  };

  private async endGame(): Promise<void> {
    this.gameOver = true;
    this.stepTimer?.remove();
    this.fireTimer?.remove();
    sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["space-invaders"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, "space-invaders": highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("SpaceInvaders.GameOver", { score: this.score, highScore, wave: this.wave });
  }
}
