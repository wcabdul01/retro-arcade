import Phaser from "phaser";
import { FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { COLS, ROWS, CELL, TETRIS_COLORS, TIMING, EMPTY_CELL_COLOR } from "../config";
import { TetrisBoard, ActivePiece, spawnPiece, randomPieceType } from "../engine";
import { PIECE_ROTATIONS, PIECE_COLOR_INDEX, PieceType } from "../pieces";
import { getPlatformAdapter } from "../../../platform";
import { createDPad } from "../../../ui/createDPad";
import { createRoundButton } from "../../../ui/createRoundButton";
import { sfx } from "../../../systems/SoundManager";
import { DPAD_X, DPAD_Y, BUTTON_X_LEFT, BUTTON_X_RIGHT, BUTTON_Y } from "../../../ui/controlLayout";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";

const PLAYFIELD_X = 30;
const PLAYFIELD_Y = 90;

export class GameScene extends Phaser.Scene {
  private board = new TetrisBoard(COLS, ROWS);
  private active!: ActivePiece;
  private nextType: PieceType = randomPieceType();
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private nextRects: Phaser.GameObjects.Rectangle[] = [];
  private dropTimer!: Phaser.Time.TimerEvent;
  private dropIntervalMs = TIMING.BASE_DROP_MS;
  private score = 0;
  private lines = 0;
  private level = 1;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private gameOver = false;

  constructor() {
    super("Tetris.Game");
  }

  init(): void {
    this.board = new TetrisBoard(COLS, ROWS);
    this.cellRects = [];
    this.nextRects = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropIntervalMs = TIMING.BASE_DROP_MS;
    this.gameOver = false;
    this.nextType = randomPieceType();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.drawFrame();
    this.buildGrids();
    this.spawnNext();

    this.dropTimer = this.time.addEvent({
      delay: this.dropIntervalMs,
      loop: true,
      callback: () => this.tickDown(),
    });

    this.input.keyboard?.on("keydown-LEFT", () => {
      sfx.move();
      this.tryMove(-1, 0);
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      sfx.move();
      this.tryMove(1, 0);
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      sfx.move();
      this.tickDown();
    });
    this.input.keyboard?.on("keydown-UP", () => this.tryRotate());
    this.input.keyboard?.on("keydown-SPACE", () => this.hardDrop());

    this.createControls();
    createPauseButton(this);
    const meta = getGameMeta("tetris");
    createInfoButton(this, meta.title, meta.howToPlay);
  }

  private drawFrame(): void {
    this.add
      .rectangle(
        PLAYFIELD_X + (COLS * CELL) / 2,
        PLAYFIELD_Y + (ROWS * CELL) / 2,
        COLS * CELL + 4,
        ROWS * CELL + 4,
        0x000000,
        0
      )
      .setStrokeStyle(2, APP_COLORS.ACCENT);
  }

  private buildGrids(): void {
    for (let y = 0; y < ROWS; y++) {
      const row: Phaser.GameObjects.Rectangle[] = [];
      for (let x = 0; x < COLS; x++) {
        const rect = this.add.rectangle(
          PLAYFIELD_X + x * CELL + CELL / 2,
          PLAYFIELD_Y + y * CELL + CELL / 2,
          CELL - 2,
          CELL - 2,
          EMPTY_CELL_COLOR
        );
        row.push(rect);
      }
      this.cellRects.push(row);
    }

    const panelX = PLAYFIELD_X + COLS * CELL + 30;
    this.add.text(panelX, PLAYFIELD_Y, "NEXT", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" });
    const nextCell = 16;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const rect = this.add.rectangle(
          panelX + x * nextCell + nextCell / 2,
          PLAYFIELD_Y + 24 + y * nextCell + nextCell / 2,
          nextCell - 2,
          nextCell - 2,
          EMPTY_CELL_COLOR
        );
        this.nextRects.push(rect);
      }
    }

    const scoreY = PLAYFIELD_Y + 24 + 4 * nextCell + 20;
    this.add.text(panelX, scoreY, "SCORE", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" });
    this.scoreText = this.add.text(panelX, scoreY + 20, "0", {
      fontFamily: FONT_FAMILY,
      fontSize: "10px",
      color: "#16170f",
    });

    this.add.text(panelX, scoreY + 50, "LEVEL", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" });
    this.levelText = this.add.text(panelX, scoreY + 70, "1", {
      fontFamily: FONT_FAMILY,
      fontSize: "10px",
      color: "#16170f",
    });
  }

  private createControls(): void {
    createDPad(this, DPAD_X, DPAD_Y, {
      onPress: (dir) => {
        if (dir === "left") this.tryMove(-1, 0);
        else if (dir === "right") this.tryMove(1, 0);
        else if (dir === "down") this.tickDown();
      },
    });
    createRoundButton(this, BUTTON_X_LEFT, BUTTON_Y, "ROT", () => this.tryRotate(), 40);
    createRoundButton(this, BUTTON_X_RIGHT, BUTTON_Y, "DRP", () => this.hardDrop(), 40);
  }

  private spawnNext(): void {
    const type = this.nextType;
    this.nextType = randomPieceType();
    this.active = spawnPiece(type, COLS);
    if (!this.board.canPlace(this.active)) {
      this.endGame();
      return;
    }
    this.redraw();
  }

  private tryMove(dx: number, dy: number): boolean {
    if (this.gameOver) return false;
    const moved: ActivePiece = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (this.board.canPlace(moved)) {
      this.active = moved;
      this.redraw();
      return true;
    }
    return false;
  }

  private tryRotate(): void {
    if (this.gameOver) return;
    const rotated: ActivePiece = { ...this.active, rotation: (this.active.rotation + 1) % 4 };
    if (this.board.canPlace(rotated)) {
      this.active = rotated;
      sfx.rotate();
      this.redraw();
    }
  }

  private tickDown(): void {
    if (this.gameOver) return;
    if (!this.tryMove(0, 1)) {
      this.lockPiece();
    }
  }

  private hardDrop(): void {
    if (this.gameOver) return;
    while (this.tryMove(0, 1)) {
      // fall until blocked
    }
    this.lockPiece();
  }

  private lockPiece(): void {
    this.board.lock(this.active);
    const cleared = this.board.clearFullLines();
    if (cleared > 0) {
      sfx.lineClear();
      const lineScores = [0, 100, 300, 500, 800];
      this.score += lineScores[cleared] * this.level;
      this.lines += cleared;
      const newLevel = Math.floor(this.lines / TIMING.LINES_PER_LEVEL) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.dropIntervalMs = Math.max(
          TIMING.MIN_DROP_MS,
          TIMING.BASE_DROP_MS - (this.level - 1) * TIMING.DROP_STEP_MS
        );
        this.dropTimer.remove();
        this.dropTimer = this.time.addEvent({
          delay: this.dropIntervalMs,
          loop: true,
          callback: () => this.tickDown(),
        });
      }
      this.scoreText.setText(String(this.score));
      this.levelText.setText(String(this.level));
    } else {
      sfx.lock();
    }
    this.spawnNext();
  }

  private redraw(): void {
    const activeCells = new Set(this.board.cellsFor(this.active).map(([x, y]) => `${x},${y}`));
    const activeColor = TETRIS_COLORS[PIECE_COLOR_INDEX[this.active.type]];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const rect = this.cellRects[y][x];
        const boardValue = this.board.grid[y][x];
        if (boardValue !== 0) {
          rect.setFillStyle(TETRIS_COLORS[boardValue]);
        } else if (activeCells.has(`${x},${y}`)) {
          rect.setFillStyle(activeColor);
        } else {
          rect.setFillStyle(EMPTY_CELL_COLOR);
        }
      }
    }
    this.drawNextPreview();
  }

  private drawNextPreview(): void {
    const cells = new Set(PIECE_ROTATIONS[this.nextType][0].map(([x, y]) => `${x},${y}`));
    const color = TETRIS_COLORS[PIECE_COLOR_INDEX[this.nextType]];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const rect = this.nextRects[y * 4 + x];
        rect.setFillStyle(cells.has(`${x},${y}`) ? color : EMPTY_CELL_COLOR);
      }
    }
  }

  private async endGame(): Promise<void> {
    this.gameOver = true;
    this.dropTimer.remove();
    sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["tetris"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, tetris: highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("Tetris.GameOver", { score: this.score, highScore });
  }
}
