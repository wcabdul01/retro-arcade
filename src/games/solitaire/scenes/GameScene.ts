import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { CARD, SOL_COLORS, GAMEPLAY } from "../config";
import {
  Board,
  Card,
  SUITS,
  dealBoard,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  isRedGroup,
  isWon,
  suitSymbol,
} from "../engine";
import { CardView } from "../entities/CardView";
import { getPlatformAdapter } from "../../../platform";
import { sfx } from "../../../systems/SoundManager";
import { createPauseButton } from "../../../ui/createPauseButton";
import { createInfoButton } from "../../../ui/createInfoButton";
import { getGameMeta } from "../../../hub/gameRegistry";
import { AdsManager } from "../../../systems/AdsManager";
import { GB } from "../../../config/AppConfig";
import { drawBulbIcon, drawUndoIcon } from "../../../ui/icons";

const MARGIN_X = (GAME_WIDTH - (7 * CARD.WIDTH + 6 * CARD.GAP)) / 2;

// Shifts the title/score/board block down so it's centered in the taller
// canvas (assuming a typical worst-case tableau cascade depth) instead of
// clustering near the top. The pause/hint/undo row at the very top is left
// alone — those are persistent controls, not part of the scrolling board.
const CONTENT_TOP = 18;
const CONTENT_BOTTOM = 600;
const VERTICAL_OFFSET = (GAME_HEIGHT - (CONTENT_BOTTOM - CONTENT_TOP)) / 2 - CONTENT_TOP;

const TOP_ROW_Y = 130 + VERTICAL_OFFSET;
const TABLEAU_TOP_Y = 226 + VERTICAL_OFFSET;
const STOCK_COL = 0;
const WASTE_COL = 1;
const FOUNDATION_COLS = [3, 4, 5, 6];

const START_HINTS = 5;
const START_UNDOS = 5;
const AD_REPLENISH_AMOUNT = 3;

function colX(i: number): number {
  return MARGIN_X + i * (CARD.WIDTH + CARD.GAP) + CARD.WIDTH / 2;
}

interface Selection {
  source: "waste" | "tableau";
  col?: number;
  cards: Card[];
}

type PileRef = { pile: "waste" } | { pile: "tableau"; col: number };

type HistoryEntry =
  | { type: "draw"; cardId: number }
  | { type: "recycle"; cardIds: number[] }
  | {
      type: "move";
      cardIds: number[];
      from: PileRef;
      to: { pile: "tableau" | "foundation"; col: number };
      flippedCardId: number | null;
      scoreDelta: number;
    };

interface HintTarget {
  cardId: number;
  destX: number;
  destY: number;
}

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private views = new Map<number, CardView>();
  private selection: Selection | null = null;
  private score = 0;
  private moves = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private ended = false;
  private history: HistoryEntry[] = [];
  private hintsLeft = START_HINTS;
  private undosLeft = START_UNDOS;
  private hintButtonText!: Phaser.GameObjects.Text;
  private undoButtonText!: Phaser.GameObjects.Text;
  private adRequestInProgress = false;

  constructor() {
    super("Solitaire.Game");
  }

  init(): void {
    this.board = dealBoard();
    this.views.clear();
    this.selection = null;
    this.score = 0;
    this.moves = 0;
    this.ended = false;
    this.history = [];
    this.hintsLeft = START_HINTS;
    this.undosLeft = START_UNDOS;
    this.adRequestInProgress = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    this.drawHeader();
    this.drawSlots();
    this.buildCardViews();
    this.renderBoard();
    createPauseButton(this);
    const meta = getGameMeta("solitaire");
    createInfoButton(this, meta.title, meta.howToPlay);
    this.buildResourceButtons();
  }

  private drawHeader(): void {
    this.scoreText = this.add.text(MARGIN_X, 28 + VERTICAL_OFFSET, "Score: 0   Moves: 0", {
      fontFamily: FONT_FAMILY,
      fontSize: "9px",
      color: "#16170f",
    });
  }

  private drawSlots(): void {
    const stockSlot = this.add
      .rectangle(colX(STOCK_COL), TOP_ROW_Y, CARD.WIDTH, CARD.HEIGHT, 0x000000, 0)
      .setStrokeStyle(2, SOL_COLORS.SLOT_BORDER)
      .setInteractive({ useHandCursor: true });
    stockSlot.on("pointerdown", () => this.drawFromStock());

    this.add
      .rectangle(colX(WASTE_COL), TOP_ROW_Y, CARD.WIDTH, CARD.HEIGHT, 0x000000, 0)
      .setStrokeStyle(2, SOL_COLORS.SLOT_BORDER);

    SUITS.forEach((suit, f) => {
      const x = colX(FOUNDATION_COLS[f]);
      const slot = this.add
        .rectangle(x, TOP_ROW_Y, CARD.WIDTH, CARD.HEIGHT, 0x000000, 0)
        .setStrokeStyle(2, SOL_COLORS.SLOT_BORDER)
        .setInteractive({ useHandCursor: true });
      slot.on("pointerdown", () => this.tryMoveSelectionToFoundation(f));
      this.add
        .text(x, TOP_ROW_Y, suitSymbol(suit), {
          fontFamily: FONT_FAMILY,
          fontSize: "17px",
          color: isRedGroup(suit) ? SOL_COLORS.LIGHT_SUIT : SOL_COLORS.DARK_SUIT,
        })
        .setOrigin(0.5)
        .setAlpha(0.45);
    });

    for (let col = 0; col < 7; col++) {
      const slot = this.add
        .rectangle(colX(col), TABLEAU_TOP_Y, CARD.WIDTH, CARD.HEIGHT, 0x000000, 0)
        .setStrokeStyle(2, SOL_COLORS.SLOT_BORDER)
        .setInteractive({ useHandCursor: true });
      slot.on("pointerdown", () => this.tryMoveSelectionToTableau(col));
    }
  }

  private buildResourceButtons(): void {
    const btnW = 180;
    const btnH = 50;
    const gap = 16;
    const centerX = GAME_WIDTH / 2;
    const rowY = CONTENT_BOTTOM + 40 + VERTICAL_OFFSET;
    this.hintButtonText = this.makeSmallButton(centerX - btnW / 2 - gap / 2, rowY, btnW, btnH, "hint", () => this.useHint());
    this.undoButtonText = this.makeSmallButton(centerX + btnW / 2 + gap / 2, rowY, btnW, btnH, "undo", () => this.undo());
    this.updateResourceText();
  }

  private makeSmallButton(
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
    if (icon === "hint") drawBulbIcon(this, iconX, y, h * 0.6);
    else drawUndoIcon(this, iconX, y, h * 0.6);
    const text = this.add
      .text(x + w * 0.12, y, "", { fontFamily: FONT_FAMILY, fontSize: "14px", color: "#9ba17c" })
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
    this.hintButtonText.setText(this.hintsLeft > 0 ? `${this.hintsLeft}` : "AD");
    this.undoButtonText.setText(this.undosLeft > 0 ? `${this.undosLeft}` : "AD");
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

  private buildCardViews(): void {
    const allCards: Card[] = [
      ...this.board.tableau.flat(),
      ...this.board.foundations.flat(),
      ...this.board.waste,
      ...this.board.stock,
    ];
    allCards.forEach((card) => {
      const view = new CardView(this, card);
      view.onTap(() => this.handleCardTap(card.id));
      this.views.set(card.id, view);
    });
  }

  private renderBoard(): void {
    this.board.stock.forEach((card, i) => {
      const view = this.views.get(card.id)!;
      const isTop = i === this.board.stock.length - 1;
      view.refresh();
      view.setPosition(colX(STOCK_COL), TOP_ROW_Y);
      view.setDepth(i);
      view.setVisible(isTop);
      view.setInputEnabled(isTop);
    });

    this.board.waste.forEach((card, i) => {
      const view = this.views.get(card.id)!;
      const isTop = i === this.board.waste.length - 1;
      view.refresh();
      view.setPosition(colX(WASTE_COL), TOP_ROW_Y);
      view.setDepth(i);
      view.setVisible(isTop);
      view.setInputEnabled(isTop);
    });

    this.board.foundations.forEach((pile, f) => {
      pile.forEach((card, i) => {
        const view = this.views.get(card.id)!;
        const isTop = i === pile.length - 1;
        view.refresh();
        view.setPosition(colX(FOUNDATION_COLS[f]), TOP_ROW_Y);
        view.setDepth(i);
        view.setVisible(isTop);
        view.setInputEnabled(isTop);
      });
    });

    this.board.tableau.forEach((column, col) => {
      let y = TABLEAU_TOP_Y;
      column.forEach((card, i) => {
        const view = this.views.get(card.id)!;
        view.refresh();
        view.setPosition(colX(col), y);
        view.setDepth(i);
        view.setVisible(true);
        view.setInputEnabled(card.faceUp);
        y += card.faceUp ? CARD.STACK_OFFSET_FACEUP : CARD.STACK_OFFSET_FACEDOWN;
      });
    });
  }

  private locateCard(id: number): { pile: "tableau" | "waste" | "foundation" | "stock"; col: number; index: number } | null {
    for (let col = 0; col < 7; col++) {
      const idx = this.board.tableau[col].findIndex((c) => c.id === id);
      if (idx >= 0) return { pile: "tableau", col, index: idx };
    }
    const wasteIdx = this.board.waste.findIndex((c) => c.id === id);
    if (wasteIdx >= 0) return { pile: "waste", col: -1, index: wasteIdx };
    for (let f = 0; f < 4; f++) {
      const fIdx = this.board.foundations[f].findIndex((c) => c.id === id);
      if (fIdx >= 0) return { pile: "foundation", col: f, index: fIdx };
    }
    const stockIdx = this.board.stock.findIndex((c) => c.id === id);
    if (stockIdx >= 0) return { pile: "stock", col: -1, index: stockIdx };
    return null;
  }

  private handleCardTap(id: number): void {
    if (this.ended) return;
    const loc = this.locateCard(id);
    if (!loc) return;

    if (loc.pile === "stock") {
      this.drawFromStock();
      return;
    }

    if (loc.pile === "foundation") {
      this.tryMoveSelectionToFoundation(loc.col);
      return;
    }

    if (this.selection && loc.pile === "tableau") {
      if (this.tryMoveSelectionToTableau(loc.col)) return;
    }

    this.clearSelection();

    if (loc.pile === "waste") {
      if (loc.index !== this.board.waste.length - 1) return;
      this.setSelection({ source: "waste", cards: [this.board.waste[loc.index]] });
    } else if (loc.pile === "tableau") {
      const card = this.board.tableau[loc.col][loc.index];
      if (!card.faceUp) return;
      const group = this.board.tableau[loc.col].slice(loc.index);
      this.setSelection({ source: "tableau", col: loc.col, cards: group });
    }
  }

  private setSelection(sel: Selection): void {
    this.selection = sel;
    sel.cards.forEach((c) => this.views.get(c.id)?.setHighlighted(true));
    sfx.select();
  }

  private clearSelection(): void {
    if (!this.selection) return;
    this.selection.cards.forEach((c) => this.views.get(c.id)?.setHighlighted(false));
    this.selection = null;
  }

  private removeSelectionFromSource(): number | null {
    if (!this.selection) return null;
    if (this.selection.source === "waste") {
      this.board.waste.pop();
      return null;
    }
    if (this.selection.source === "tableau" && this.selection.col !== undefined) {
      const col = this.selection.col;
      const count = this.selection.cards.length;
      this.board.tableau[col].splice(this.board.tableau[col].length - count, count);
      const newTop = this.board.tableau[col][this.board.tableau[col].length - 1];
      if (newTop && !newTop.faceUp) {
        newTop.faceUp = true;
        return newTop.id;
      }
    }
    return null;
  }

  private selectionSourceRef(): PileRef {
    if (!this.selection) throw new Error("no selection");
    return this.selection.source === "waste" ? { pile: "waste" } : { pile: "tableau", col: this.selection.col ?? 0 };
  }

  private tryMoveSelectionToTableau(col: number): boolean {
    if (!this.selection) return false;
    const [firstCard] = this.selection.cards;
    if (this.selection.source === "tableau" && this.selection.col === col) {
      this.clearSelection();
      return false;
    }
    if (!canPlaceOnTableau(firstCard, this.board.tableau[col])) return false;
    const moved = this.selection.cards;
    const from = this.selectionSourceRef();
    const flippedCardId = this.removeSelectionFromSource();
    this.board.tableau[col].push(...moved);
    this.history.push({
      type: "move",
      cardIds: moved.map((c) => c.id),
      from,
      to: { pile: "tableau", col },
      flippedCardId,
      scoreDelta: 0,
    });
    this.clearSelection();
    this.moves += 1;
    sfx.move();
    this.renderBoard();
    this.updateHeader();
    return true;
  }

  private tryMoveSelectionToFoundation(foundationIndex: number): boolean {
    if (!this.selection) return false;
    if (this.selection.cards.length !== 1) return false;
    const card = this.selection.cards[0];
    if (!canPlaceOnFoundation(card, this.board.foundations[foundationIndex])) return false;
    const from = this.selectionSourceRef();
    const flippedCardId = this.removeSelectionFromSource();
    this.board.foundations[foundationIndex].push(card);
    this.history.push({
      type: "move",
      cardIds: [card.id],
      from,
      to: { pile: "foundation", col: foundationIndex },
      flippedCardId,
      scoreDelta: GAMEPLAY.SCORE_PER_FOUNDATION_CARD,
    });
    this.clearSelection();
    this.moves += 1;
    this.score += GAMEPLAY.SCORE_PER_FOUNDATION_CARD;
    sfx.score();
    this.renderBoard();
    this.updateHeader();
    if (isWon(this.board)) {
      this.handleWin();
    }
    return true;
  }

  private drawFromStock(): void {
    if (this.ended) return;
    this.clearSelection();
    if (this.board.stock.length > 0) {
      const card = this.board.stock.pop();
      if (!card) return;
      card.faceUp = true;
      this.board.waste.push(card);
      this.history.push({ type: "draw", cardId: card.id });
    } else if (this.board.waste.length > 0) {
      const order = this.board.waste.map((c) => c.id);
      while (this.board.waste.length > 0) {
        const card = this.board.waste.pop();
        if (!card) break;
        card.faceUp = false;
        this.board.stock.push(card);
      }
      this.history.push({ type: "recycle", cardIds: order });
    } else {
      return;
    }
    sfx.move();
    this.renderBoard();
  }

  private undo(): void {
    if (this.ended) return;
    if (this.undosLeft <= 0) {
      this.promptForAd("undo");
      return;
    }
    const entry = this.history.pop();
    if (!entry) return;
    this.clearSelection();

    if (entry.type === "draw") {
      const card = this.views.get(entry.cardId)?.card;
      if (card) {
        this.board.waste.pop();
        card.faceUp = false;
        this.board.stock.push(card);
      }
    } else if (entry.type === "recycle") {
      const restored: Card[] = [];
      for (let i = 0; i < entry.cardIds.length; i++) {
        const card = this.board.stock.pop();
        if (!card) break;
        card.faceUp = true;
        restored.push(card);
      }
      this.board.waste.push(...restored);
    } else {
      const count = entry.cardIds.length;
      if (entry.to.pile === "tableau") {
        this.board.tableau[entry.to.col].splice(this.board.tableau[entry.to.col].length - count, count);
      } else {
        this.board.foundations[entry.to.col].splice(this.board.foundations[entry.to.col].length - count, count);
      }
      if (entry.flippedCardId !== null) {
        const flipped = this.views.get(entry.flippedCardId)?.card;
        if (flipped) flipped.faceUp = false;
      }
      const movedCards = entry.cardIds.map((id) => this.views.get(id)?.card).filter((c): c is Card => !!c);
      if (entry.from.pile === "waste") {
        this.board.waste.push(...movedCards);
      } else {
        this.board.tableau[entry.from.col].push(...movedCards);
      }
      this.score -= entry.scoreDelta;
      this.moves = Math.max(0, this.moves - 1);
    }

    this.undosLeft -= 1;
    sfx.move();
    this.renderBoard();
    this.updateHeader();
    this.updateResourceText();
  }

  private columnTopY(col: number): number {
    let y = TABLEAU_TOP_Y;
    this.board.tableau[col].forEach((card) => {
      y += card.faceUp ? CARD.STACK_OFFSET_FACEUP : CARD.STACK_OFFSET_FACEDOWN;
    });
    return y;
  }

  private findHint(): HintTarget | null {
    if (this.board.waste.length > 0) {
      const card = this.board.waste[this.board.waste.length - 1];
      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(card, this.board.foundations[f])) {
          return { cardId: card.id, destX: colX(FOUNDATION_COLS[f]), destY: TOP_ROW_Y };
        }
      }
    }
    for (let col = 0; col < 7; col++) {
      const column = this.board.tableau[col];
      if (column.length === 0) continue;
      const top = column[column.length - 1];
      if (!top.faceUp) continue;
      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(top, this.board.foundations[f])) {
          return { cardId: top.id, destX: colX(FOUNDATION_COLS[f]), destY: TOP_ROW_Y };
        }
      }
    }
    if (this.board.waste.length > 0) {
      const card = this.board.waste[this.board.waste.length - 1];
      for (let col = 0; col < 7; col++) {
        if (canPlaceOnTableau(card, this.board.tableau[col])) {
          return { cardId: card.id, destX: colX(col), destY: this.columnTopY(col) };
        }
      }
    }
    for (let col = 0; col < 7; col++) {
      const column = this.board.tableau[col];
      const firstFaceUpIndex = column.findIndex((c) => c.faceUp);
      if (firstFaceUpIndex === -1) continue;
      const groupBottom = column[firstFaceUpIndex];
      for (let dest = 0; dest < 7; dest++) {
        if (dest === col) continue;
        if (canPlaceOnTableau(groupBottom, this.board.tableau[dest])) {
          return { cardId: groupBottom.id, destX: colX(dest), destY: this.columnTopY(dest) };
        }
      }
    }
    if (this.board.stock.length > 0 || this.board.waste.length > 0) {
      return { cardId: -1, destX: colX(STOCK_COL), destY: TOP_ROW_Y };
    }
    return null;
  }

  private flashHint(hint: HintTarget): void {
    if (hint.cardId >= 0) {
      const view = this.views.get(hint.cardId);
      view?.setHighlighted(true);
      this.time.delayedCall(1400, () => view?.setHighlighted(false));
    }
    const marker = this.add
      .rectangle(hint.destX, hint.destY, CARD.WIDTH + 6, CARD.HEIGHT + 6, 0x000000, 0)
      .setStrokeStyle(3, SOL_COLORS.HIGHLIGHT)
      .setDepth(999);
    this.tweens.add({
      targets: marker,
      alpha: { from: 1, to: 0.2 },
      yoyo: true,
      repeat: 2,
      duration: 220,
      onComplete: () => marker.destroy(),
    });
  }

  private useHint(): void {
    if (this.ended) return;
    if (this.hintsLeft <= 0) {
      this.promptForAd("hint");
      return;
    }
    const hint = this.findHint();
    if (!hint) return;
    this.hintsLeft -= 1;
    this.updateResourceText();
    sfx.select();
    this.flashHint(hint);
  }

  private updateHeader(): void {
    this.scoreText.setText(`Score: ${this.score}   Moves: ${this.moves}`);
  }

  private async handleWin(): Promise<void> {
    this.ended = true;
    sfx.win();
    const adapter = getPlatformAdapter();
    const saved = await adapter.loadData();
    const highScore = Math.max(saved.highScores["solitaire"] ?? 0, this.score);
    const updated = {
      ...saved,
      highScores: { ...saved.highScores, solitaire: highScore },
    };
    await adapter.saveData(updated);
    this.registry.set("saveData", updated);
    this.scene.start("Solitaire.GameOver", { score: this.score, highScore, moves: this.moves });
  }
}
