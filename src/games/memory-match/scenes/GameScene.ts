import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS as APP_COLORS, CONTENT_MARGIN, GB } from "../../../config/AppConfig";
import { DIFFICULTIES, GRID_GAP, TIMING, TILE_BACK_COLOR, TILE_FACE_COLOR, SYMBOL_COLOR } from "../config";
import { drawSymbol } from "../symbols";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";
import { AdsManager } from "../../../systems/AdsManager";
import { drawBulbIcon } from "../../../ui/icons";

const START_HINTS = 5;
const AD_REPLENISH_AMOUNT = 3;
const HINT_REVEAL_MS = 900;

// Grid sizing budget: wider than the shared PLAYFIELD box since this game has
// no D-pad/action button competing for horizontal space, and tall enough to
// let harder difficulties (more rows) use real vertical room instead of
// shrinking tiles unnecessarily.
const MAX_TILE_SIZE = 100;
const GRID_AREA_WIDTH = GAME_WIDTH - CONTENT_MARGIN * 2;
const GRID_AREA_MAX_HEIGHT = 780;

interface TileState {
  symbol: number;
  revealed: boolean;
  matched: boolean;
  rect: Phaser.GameObjects.Rectangle;
  symbolGfx: Phaser.GameObjects.Graphics;
}

interface Layout {
  tile: number;
  gridWidth: number;
  gridHeight: number;
  gridLeft: number;
  gridTop: number;
  offsetY: number;
}

interface GameSceneData {
  difficultyIndex?: number;
}

export class GameScene extends Phaser.Scene {
  private difficultyIndex = 0;
  private tiles: TileState[] = [];
  private selected: TileState[] = [];
  private matchedCount = 0;
  private timeLeft = 0;
  private timerEvent!: Phaser.Time.TimerEvent;
  private score = 0;
  private locked = false;
  private hinting = false;
  private ended = false;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private hintsLeft = START_HINTS;
  private hintButtonText!: Phaser.GameObjects.Text;
  private adRequestInProgress = false;

  constructor() {
    super("MemoryMatch.Game");
  }

  init(data: GameSceneData): void {
    this.difficultyIndex = data.difficultyIndex ?? 0;
    const level = DIFFICULTIES[this.difficultyIndex] ?? DIFFICULTIES[0];
    this.tiles = [];
    this.selected = [];
    this.matchedCount = 0;
    this.timeLeft = level.timeLimitS;
    this.score = 0;
    this.locked = false;
    this.hinting = false;
    this.ended = false;
    this.hintsLeft = START_HINTS;
    this.adRequestInProgress = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    const level = DIFFICULTIES[this.difficultyIndex] ?? DIFFICULTIES[0];
    const layout = this.computeLayout(level.cols, level.rows);
    this.drawHeader(level.name, layout);
    this.buildGrid(level.cols, level.rows, layout);
    this.buildHintButton(layout);
    createPauseButton(this);
    const meta = getGameMeta("memory-match");
    createInfoButton(this, meta.title, meta.howToPlay);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tickTimer(),
    });
  }

  private computeLayout(cols: number, rows: number): Layout {
    const widthBased = (GRID_AREA_WIDTH - (cols - 1) * GRID_GAP) / cols;
    const heightBased = (GRID_AREA_MAX_HEIGHT - (rows - 1) * GRID_GAP) / rows;
    const tile = Math.min(widthBased, heightBased, MAX_TILE_SIZE);
    const gridWidth = cols * tile + (cols - 1) * GRID_GAP;
    const gridHeight = rows * tile + (rows - 1) * GRID_GAP;

    const relGridTop = 106;
    const relHintY = relGridTop + gridHeight + 54;
    const designHeight = relHintY + 20;
    const offsetY = (GAME_HEIGHT - designHeight) / 2;

    const gridLeft = (GAME_WIDTH - gridWidth) / 2;
    const gridTop = offsetY + relGridTop;

    return { tile, gridWidth, gridHeight, gridLeft, gridTop, offsetY };
  }

  private drawHeader(difficultyName: string, layout: Layout): void {
    this.add
      .text(GAME_WIDTH / 2, layout.offsetY + 30, difficultyName.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "9px",
        color: "#545a41",
      })
      .setOrigin(0.5);
    this.scoreText = this.add.text(layout.gridLeft, layout.offsetY + 56, "Score: 0", {
      fontFamily: FONT_FAMILY,
      fontSize: "9px",
      color: "#16170f",
    });
    this.timeText = this.add
      .text(layout.gridLeft + layout.gridWidth, layout.offsetY + 56, `Time: ${this.timeLeft}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "9px",
        color: "#16170f",
      })
      .setOrigin(1, 0);
    this.add
      .rectangle(
        layout.gridLeft + layout.gridWidth / 2,
        layout.gridTop + layout.gridHeight / 2,
        layout.gridWidth + 4,
        layout.gridHeight + 4,
        0x000000,
        0
      )
      .setStrokeStyle(2, APP_COLORS.ACCENT);
  }

  private buildGrid(cols: number, rows: number, layout: Layout): void {
    const total = cols * rows;
    const pairCount = total / 2;
    const symbols: number[] = [];
    for (let i = 0; i < pairCount; i++) {
      symbols.push(i, i);
    }
    Phaser.Utils.Array.Shuffle(symbols);

    const { tile, gridLeft, gridTop } = layout;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const x = gridLeft + col * (tile + GRID_GAP) + tile / 2;
        const y = gridTop + row * (tile + GRID_GAP) + tile / 2;
        const rect = this.add
          .rectangle(x, y, tile, tile, TILE_BACK_COLOR)
          .setStrokeStyle(3, APP_COLORS.ACCENT)
          .setInteractive({ useHandCursor: true });

        const symbolGfx = this.add.graphics({ x, y });
        drawSymbol(symbolGfx, symbols[index], tile * 0.7, SYMBOL_COLOR);
        symbolGfx.setVisible(false);

        const tileState: TileState = { symbol: symbols[index], revealed: false, matched: false, rect, symbolGfx };
        this.tiles.push(tileState);
        rect.on("pointerdown", () => this.handleTileTap(tileState));
      }
    }
  }

  private buildHintButton(layout: Layout): void {
    const y = layout.gridTop + layout.gridHeight + 54;
    const width = 140;
    const height = 40;
    const centerX = GAME_WIDTH / 2;
    const bg = this.add
      .rectangle(centerX, y, width, height, GB.DARK)
      .setStrokeStyle(3, GB.DARKEST)
      .setInteractive({ useHandCursor: true });
    drawBulbIcon(this, centerX - width * 0.2, y, height * 0.55);
    this.hintButtonText = this.add
      .text(centerX + width * 0.08, y, "", { fontFamily: FONT_FAMILY, fontSize: "11px", color: "#9ba17c" })
      .setOrigin(0, 0.5);
    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => this.useHint());
    this.updateResourceText();
  }

  private updateResourceText(): void {
    this.hintButtonText.setText(this.hintsLeft > 0 ? `${this.hintsLeft}` : "WATCH AD");
  }

  private useHint(): void {
    if (this.ended || this.locked || this.hinting) return;
    if (this.hintsLeft <= 0) {
      this.promptForAd();
      return;
    }
    const hidden = this.tiles.filter((t) => !t.matched && !t.revealed);
    const bySymbol = new Map<number, TileState[]>();
    hidden.forEach((t) => {
      const arr = bySymbol.get(t.symbol) ?? [];
      arr.push(t);
      bySymbol.set(t.symbol, arr);
    });
    let pair: TileState[] | null = null;
    for (const arr of bySymbol.values()) {
      if (arr.length >= 2) {
        pair = arr.slice(0, 2);
        break;
      }
    }
    if (!pair) return;

    sfx.select();
    this.hintsLeft -= 1;
    this.updateResourceText();
    this.hinting = true;
    const revealed = pair;
    revealed.forEach((t) => {
      t.rect.setFillStyle(TILE_FACE_COLOR);
      t.symbolGfx.setVisible(true);
    });
    this.time.delayedCall(HINT_REVEAL_MS, () => {
      revealed.forEach((t) => {
        if (!t.matched) {
          t.rect.setFillStyle(TILE_BACK_COLOR);
          t.symbolGfx.setVisible(false);
        }
      });
      this.hinting = false;
    });
  }

  private promptForAd(): void {
    if (this.adRequestInProgress) return;
    this.adRequestInProgress = true;
    AdsManager.showRewarded(
      () => {
        this.hintsLeft += AD_REPLENISH_AMOUNT;
        this.updateResourceText();
        this.adRequestInProgress = false;
      },
      () => {
        this.adRequestInProgress = false;
      }
    );
  }

  private handleTileTap(tile: TileState): void {
    if (this.ended || this.locked || this.hinting || tile.revealed || tile.matched || this.selected.length >= 2) return;

    sfx.select();
    tile.revealed = true;
    tile.rect.setFillStyle(TILE_FACE_COLOR);
    tile.symbolGfx.setVisible(true);
    this.selected.push(tile);

    if (this.selected.length < 2) return;

    const [a, b] = this.selected;
    if (a.symbol === b.symbol) {
      sfx.score();
      a.matched = true;
      b.matched = true;
      a.rect.setStrokeStyle(4, APP_COLORS.SUCCESS);
      b.rect.setStrokeStyle(4, APP_COLORS.SUCCESS);
      this.matchedCount += 1;
      this.score += 20;
      this.scoreText.setText(`Score: ${this.score}`);
      this.selected = [];
      if (this.matchedCount === this.tiles.length / 2) {
        this.endGame(true);
      }
      return;
    }

    this.locked = true;
    sfx.hurt();
    this.time.delayedCall(TIMING.FLIP_BACK_DELAY_MS, () => {
      a.revealed = false;
      b.revealed = false;
      a.rect.setFillStyle(TILE_BACK_COLOR);
      b.rect.setFillStyle(TILE_BACK_COLOR);
      a.symbolGfx.setVisible(false);
      b.symbolGfx.setVisible(false);
      this.selected = [];
      this.locked = false;
    });
  }

  private tickTimer(): void {
    if (this.ended) return;
    this.timeLeft -= 1;
    this.timeText.setText(`Time: ${Math.max(0, this.timeLeft)}`);
    if (this.timeLeft <= 0) {
      this.endGame(false);
    }
  }

  private async endGame(win: boolean): Promise<void> {
    this.ended = true;
    this.timerEvent.remove();
    if (win) {
      sfx.win();
      this.score += this.timeLeft * 5;
    } else {
      sfx.gameOver();
    }
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["memory-match"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, "memory-match": highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("MemoryMatch.GameOver", { win, score: this.score, highScore });
  }
}
