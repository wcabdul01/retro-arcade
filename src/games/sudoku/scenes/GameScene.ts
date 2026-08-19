import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { GRID_SIZE, CELL, DIFFICULTIES, GAMEPLAY, SUDOKU_COLORS } from "../config";
import { generatePuzzle, Grid } from "../engine";
import { PLAYFIELD_Y } from "../../../ui/controlLayout";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";
import { drawBulbIcon, drawUndoIcon } from "../../../ui/icons";
import { AdsManager } from "../../../systems/AdsManager";

const START_HINTS = 5;
const START_UNDOS = 5;
const AD_REPLENISH_AMOUNT = 3;

// Sudoku has no D-pad, so its layout is centered on the full canvas width
// rather than the shared (D-pad-oriented) PLAYFIELD box. This vertical shift
// centers the whole title->grid->numberpad->hint-row block in the taller
// canvas instead of leaving it clustered near the top.
const CONTENT_TOP = 30;
const CONTENT_BOTTOM = 910;
const VERTICAL_OFFSET = (GAME_HEIGHT - (CONTENT_BOTTOM - CONTENT_TOP)) / 2 - CONTENT_TOP;

interface ContinueState {
  difficultyIndex: number;
  score: number;
  puzzle: Grid;
  solution: Grid;
  current: Grid;
  filledCount: number;
  totalEmpty: number;
}

interface GameSceneData {
  difficultyIndex?: number;
  continueState?: ContinueState;
}

interface CellState {
  row: number;
  col: number;
  given: boolean;
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

interface SelectedCell {
  row: number;
  col: number;
}

interface SudokuMove {
  row: number;
  col: number;
  prevValue: number;
  wasMistake: boolean;
  scoreDelta: number;
  filledDelta: number;
}

export class GameScene extends Phaser.Scene {
  private difficultyIndex = 0;
  private puzzle: Grid = [];
  private solution: Grid = [];
  private current: Grid = [];
  private cells: CellState[][] = [];
  private selected: SelectedCell | null = null;
  private totalEmpty = 0;
  private filledCount = 0;
  private lives = GAMEPLAY.START_LIVES;
  private score = 0;
  private ended = false;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gridX = 0;
  private gridY = 0;
  private numberPadBottom = 0;
  private continueState: ContinueState | null = null;
  private moveHistory: SudokuMove[] = [];
  private hintsLeft = START_HINTS;
  private undosLeft = START_UNDOS;
  private hintButtonText!: Phaser.GameObjects.Text;
  private undoButtonText!: Phaser.GameObjects.Text;
  private adRequestInProgress = false;

  constructor() {
    super("Sudoku.Game");
  }

  init(data: GameSceneData): void {
    this.continueState = data.continueState ?? null;
    this.difficultyIndex = data.continueState?.difficultyIndex ?? data.difficultyIndex ?? 0;
    this.cells = [];
    this.selected = null;
    this.filledCount = data.continueState?.filledCount ?? 0;
    this.totalEmpty = data.continueState?.totalEmpty ?? 0;
    this.lives = data.continueState ? 1 : GAMEPLAY.START_LIVES;
    this.score = data.continueState?.score ?? 0;
    this.ended = false;
    this.moveHistory = [];
    this.hintsLeft = START_HINTS;
    this.undosLeft = START_UNDOS;
    this.adRequestInProgress = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.drawHeader();
    createPauseButton(this);
    const meta = getGameMeta("sudoku");
    createInfoButton(this, meta.title, meta.howToPlay);

    if (this.continueState) {
      this.puzzle = this.continueState.puzzle;
      this.solution = this.continueState.solution;
      this.current = this.continueState.current;
      this.buildGrid();
      this.buildNumberPad();
      this.buildHintUndoRow();
      this.setupKeyboard();
      return;
    }

    const loadingText = this.add
      .text(GAME_WIDTH / 2, PLAYFIELD_Y + 150 + VERTICAL_OFFSET, "GENERATING...", {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    this.time.delayedCall(30, () => {
      const level = DIFFICULTIES[this.difficultyIndex] ?? DIFFICULTIES[0];
      const { puzzle, solution } = generatePuzzle(level.clues);
      this.puzzle = puzzle;
      this.solution = solution;
      this.current = puzzle.map((row) => [...row]);

      let empty = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (puzzle[r][c] === 0) empty += 1;
        }
      }
      this.totalEmpty = empty;

      loadingText.destroy();
      this.buildGrid();
      this.buildNumberPad();
      this.buildHintUndoRow();
      this.setupKeyboard();
    });
  }

  private setupKeyboard(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.ended) return;
      if (event.key >= "1" && event.key <= "9") {
        this.enterDigit(Number(event.key));
        return;
      }
      switch (event.key) {
        case "Backspace":
        case "Delete":
        case "0":
          this.clearSelected();
          break;
        case "ArrowUp":
          event.preventDefault();
          this.moveSelection(0, -1);
          break;
        case "ArrowDown":
          event.preventDefault();
          this.moveSelection(0, 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          this.moveSelection(-1, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          this.moveSelection(1, 0);
          break;
      }
    });
  }

  private moveSelection(dcol: number, drow: number): void {
    const base = this.selected ?? { row: 0, col: 0 };
    const row = Phaser.Math.Clamp(base.row + drow, 0, GRID_SIZE - 1);
    const col = Phaser.Math.Clamp(base.col + dcol, 0, GRID_SIZE - 1);
    this.selectCell(row, col);
  }

  private drawHeader(): void {
    const gridWidth = GRID_SIZE * CELL;
    const gridLeft = (GAME_WIDTH - gridWidth) / 2;
    this.scoreText = this.add.text(gridLeft, 36 + VERTICAL_OFFSET, `Score: ${this.score}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: "#16170f",
    });
    this.livesText = this.add
      .text(gridLeft + gridWidth, 36 + VERTICAL_OFFSET, `Lives: ${this.lives}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#16170f",
      })
      .setOrigin(1, 0);
  }

  private buildGrid(): void {
    const gridWidth = GRID_SIZE * CELL;
    this.gridX = (GAME_WIDTH - gridWidth) / 2;
    this.gridY = PLAYFIELD_Y + 8 + VERTICAL_OFFSET;

    this.add
      .rectangle(
        this.gridX + gridWidth / 2,
        this.gridY + gridWidth / 2,
        gridWidth + 4,
        gridWidth + 4,
        0x000000,
        0
      )
      .setStrokeStyle(2, APP_COLORS.ACCENT);

    for (let row = 0; row < GRID_SIZE; row++) {
      const rowCells: CellState[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = this.gridX + col * CELL + CELL / 2;
        const y = this.gridY + row * CELL + CELL / 2;
        const given = this.puzzle[row][col] !== 0;
        const rect = this.add
          .rectangle(x, y, CELL - 1, CELL - 1, SUDOKU_COLORS.CELL_BG)
          .setStrokeStyle(1, SUDOKU_COLORS.GRID_LINE, 0.35)
          .setInteractive({ useHandCursor: true });
        const value = this.current[row][col];
        const text = this.add
          .text(x, y, value ? String(value) : "", {
            fontFamily: FONT_FAMILY,
            fontSize: "20px",
            color: given ? "#16170f" : "#545a41",
          })
          .setOrigin(0.5);
        rect.on("pointerdown", () => this.selectCell(row, col));
        rowCells.push({ row, col, given, rect, text });
      }
      this.cells.push(rowCells);
    }

    this.drawBoxLines(gridWidth);
  }

  private drawBoxLines(gridWidth: number): void {
    const g = this.add.graphics();
    g.lineStyle(3, SUDOKU_COLORS.BOX_LINE, 1);
    g.beginPath();
    for (let i = 0; i <= GRID_SIZE; i += 3) {
      const x = this.gridX + i * CELL;
      g.moveTo(x, this.gridY);
      g.lineTo(x, this.gridY + gridWidth);
      const y = this.gridY + i * CELL;
      g.moveTo(this.gridX, y);
      g.lineTo(this.gridX + gridWidth, y);
    }
    g.strokePath();
  }

  private buildNumberPad(): void {
    const gridWidth = GRID_SIZE * CELL;
    const cols = 3;
    const rows = 3;
    const btnW = 130;
    const btnH = 70;
    const gapX = 12;
    const gapY = 12;
    const padWidth = cols * btnW + (cols - 1) * gapX;
    const padX = (GAME_WIDTH - padWidth) / 2;
    const padTop = this.gridY + gridWidth + 20;

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const digit = i + 1;
      const x = padX + col * (btnW + gapX) + btnW / 2;
      const y = padTop + row * (btnH + gapY) + btnH / 2;
      this.makeNumberButton(x, y, btnW, btnH, String(digit), () => this.enterDigit(digit));
    }

    const padBottom = padTop + rows * btnH + (rows - 1) * gapY;
    const clearHeight = 48;
    const clearGap = 20;
    const clearY = padBottom + clearGap + clearHeight / 2;
    this.makeNumberButton(padX + padWidth / 2, clearY, padWidth, clearHeight, "CLEAR", () => this.clearSelected());
    this.numberPadBottom = clearY + clearHeight / 2;
  }

  private buildHintUndoRow(): void {
    const btnW = 199;
    const btnH = 60;
    const gap = 16;
    const centerX = GAME_WIDTH / 2;
    const rowY = this.numberPadBottom + 30 + btnH / 2;
    this.hintButtonText = this.makeIconButton(centerX - btnW / 2 - gap / 2, rowY, btnW, btnH, "hint", () => this.useHint());
    this.undoButtonText = this.makeIconButton(centerX + btnW / 2 + gap / 2, rowY, btnW, btnH, "undo", () => this.undo());
    this.updateResourceText();
  }

  private makeNumberButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const bg = this.add
      .rectangle(x, y, w, h, GB.DARK)
      .setStrokeStyle(3, GB.DARKEST)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#9ba17c" })
      .setOrigin(0.5);
    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => {
      sfx.select();
      onClick();
    });
    return text;
  }

  private makeIconButton(
    x: number,
    y: number,
    w: number,
    h: number,
    icon: "hint" | "undo",
    onClick: () => void
  ): Phaser.GameObjects.Text {
    const bg = this.add
      .rectangle(x, y, w, h, GB.DARK)
      .setStrokeStyle(3, GB.DARKEST)
      .setInteractive({ useHandCursor: true });
    const iconX = x - w * 0.16;
    if (icon === "hint") drawBulbIcon(this, iconX, y, h * 0.5);
    else drawUndoIcon(this, iconX, y, h * 0.5);
    const text = this.add
      .text(x + w * 0.12, y, "", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#9ba17c" })
      .setOrigin(0, 0.5);
    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => {
      sfx.select();
      onClick();
    });
    return text;
  }

  private updateResourceText(): void {
    this.hintButtonText.setText(this.hintsLeft > 0 ? `${this.hintsLeft}` : "WATCH AD");
    this.undoButtonText.setText(this.undosLeft > 0 ? `${this.undosLeft}` : "WATCH AD");
  }

  private useHint(): void {
    if (this.ended) return;
    if (this.hintsLeft <= 0) {
      this.promptForAd("hint");
      return;
    }
    let target = this.selected;
    if (!target || this.current[target.row][target.col] !== 0) {
      target = this.findEmptyCell();
    }
    if (!target) return;
    const { row, col } = target;
    const cell = this.cells[row][col];
    const prevValue = this.current[row][col];
    const digit = this.solution[row][col];
    this.current[row][col] = digit;
    cell.text.setText(String(digit));
    this.filledCount += 1;
    this.moveHistory.push({ row, col, prevValue, wasMistake: false, scoreDelta: 0, filledDelta: 1 });
    this.hintsLeft -= 1;
    this.updateResourceText();
    sfx.select();
    if (this.filledCount >= this.totalEmpty) {
      this.endGame(true);
    }
  }

  private findEmptyCell(): SelectedCell | null {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.current[r][c] === 0) return { row: r, col: c };
      }
    }
    return null;
  }

  private undo(): void {
    if (this.ended) return;
    if (this.undosLeft <= 0) {
      this.promptForAd("undo");
      return;
    }
    const move = this.moveHistory.pop();
    if (!move) return;
    if (move.wasMistake) {
      this.lives += 1;
      this.livesText.setText(`Lives: ${this.lives}`);
    } else {
      this.current[move.row][move.col] = move.prevValue;
      this.cells[move.row][move.col].text.setText(move.prevValue ? String(move.prevValue) : "");
      this.filledCount -= move.filledDelta;
      this.score -= move.scoreDelta;
      this.scoreText.setText(`Score: ${this.score}`);
    }
    this.undosLeft -= 1;
    this.updateResourceText();
    sfx.move();
  }

  private promptForAd(kind: "hint" | "undo"): void {
    if (this.adRequestInProgress) return;
    this.adRequestInProgress = true;
    AdsManager.showRewarded(
      () => {
        if (kind === "hint") this.hintsLeft += AD_REPLENISH_AMOUNT;
        else this.undosLeft += AD_REPLENISH_AMOUNT;
        this.updateResourceText();
        this.adRequestInProgress = false;
      },
      () => {
        this.adRequestInProgress = false;
      }
    );
  }

  private selectCell(row: number, col: number): void {
    if (this.ended) return;
    sfx.select();
    if (this.selected) {
      const prev = this.cells[this.selected.row][this.selected.col];
      prev.rect.setFillStyle(SUDOKU_COLORS.CELL_BG);
    }
    this.selected = { row, col };
    this.cells[row][col].rect.setFillStyle(SUDOKU_COLORS.SELECTED);
  }

  private enterDigit(digit: number): void {
    if (this.ended || !this.selected) return;
    const { row, col } = this.selected;
    const cell = this.cells[row][col];
    if (cell.given || this.current[row][col] === digit) return;

    if (this.solution[row][col] === digit) {
      this.current[row][col] = digit;
      cell.text.setText(String(digit));
      sfx.score();
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
      this.filledCount += 1;
      this.moveHistory.push({ row, col, prevValue: 0, wasMistake: false, scoreDelta: 10, filledDelta: 1 });
      if (this.filledCount >= this.totalEmpty) {
        this.endGame(true);
      }
    } else {
      sfx.hurt();
      this.lives -= 1;
      this.livesText.setText(`Lives: ${this.lives}`);
      this.moveHistory.push({ row, col, prevValue: 0, wasMistake: true, scoreDelta: 0, filledDelta: 0 });
      if (this.lives <= 0) {
        this.endGame(false);
      }
    }
  }

  private clearSelected(): void {
    if (this.ended || !this.selected) return;
    const { row, col } = this.selected;
    const cell = this.cells[row][col];
    if (cell.given) return;
    if (this.current[row][col] !== 0) {
      const prevValue = this.current[row][col];
      this.current[row][col] = 0;
      cell.text.setText("");
      this.filledCount -= 1;
      this.moveHistory.push({ row, col, prevValue, wasMistake: false, scoreDelta: 0, filledDelta: -1 });
    }
  }

  private async endGame(win: boolean): Promise<void> {
    this.ended = true;
    if (win) sfx.win();
    else sfx.gameOver();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["sudoku"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, sudoku: highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    const resumeState: ContinueState | undefined = win
      ? undefined
      : {
          difficultyIndex: this.difficultyIndex,
          score: this.score,
          puzzle: this.puzzle,
          solution: this.solution,
          current: this.current,
          filledCount: this.filledCount,
          totalEmpty: this.totalEmpty,
        };
    this.scene.start("Sudoku.GameOver", { win, score: this.score, highScore, resumeState });
  }
}
