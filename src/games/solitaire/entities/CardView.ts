import Phaser from "phaser";
import { FONT_FAMILY } from "../../../config/AppConfig";
import { CARD, SOL_COLORS } from "../config";
import { Card, isRedGroup, rankLabel, suitSymbol } from "../engine";

export class CardView extends Phaser.GameObjects.Container {
  card: Card;
  private bg: Phaser.GameObjects.Rectangle;
  private rankText: Phaser.GameObjects.Text;
  private symbolText: Phaser.GameObjects.Text;
  private backMark: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, card: Card) {
    super(scene, 0, 0);
    this.card = card;
    scene.add.existing(this);

    this.bg = scene.add.rectangle(0, 0, CARD.WIDTH, CARD.HEIGHT, SOL_COLORS.FACE_BG).setStrokeStyle(2, SOL_COLORS.BORDER);
    this.rankText = scene.add
      .text(-CARD.WIDTH / 2 + 5, -CARD.HEIGHT / 2 + 3, "", { fontFamily: FONT_FAMILY, fontSize: "10px", color: SOL_COLORS.DARK_SUIT })
      .setOrigin(0, 0);
    this.symbolText = scene.add
      .text(0, 8, "", { fontFamily: FONT_FAMILY, fontSize: "19px", color: SOL_COLORS.DARK_SUIT })
      .setOrigin(0.5);
    this.backMark = scene.add
      .text(0, 0, "*", { fontFamily: FONT_FAMILY, fontSize: "17px", color: SOL_COLORS.BACK_MARK })
      .setOrigin(0.5);

    this.add([this.bg, this.rankText, this.symbolText, this.backMark]);
    this.setSize(CARD.WIDTH, CARD.HEIGHT);
    this.bg.setInteractive({ useHandCursor: true });

    this.refresh();
  }

  setCard(card: Card): void {
    this.card = card;
    this.refresh();
  }

  refresh(): void {
    if (this.card.faceUp) {
      this.bg.setFillStyle(SOL_COLORS.FACE_BG);
      const color = isRedGroup(this.card.suit) ? SOL_COLORS.LIGHT_SUIT : SOL_COLORS.DARK_SUIT;
      this.rankText.setText(`${rankLabel(this.card.rank)}${suitSymbol(this.card.suit)}`).setColor(color);
      this.symbolText.setText(suitSymbol(this.card.suit)).setColor(color);
      this.rankText.setVisible(true);
      this.symbolText.setVisible(true);
      this.backMark.setVisible(false);
    } else {
      this.bg.setFillStyle(SOL_COLORS.BACK_BG);
      this.rankText.setVisible(false);
      this.symbolText.setVisible(false);
      this.backMark.setVisible(true);
    }
    this.setHighlighted(false);
  }

  setHighlighted(on: boolean): void {
    this.bg.setStrokeStyle(on ? 3 : 2, on ? SOL_COLORS.HIGHLIGHT : SOL_COLORS.BORDER);
  }

  onTap(handler: () => void): void {
    this.bg.on("pointerdown", handler);
  }

  /**
   * Only one card should ever be tappable at a given pile position (the
   * visible top of a stack) — several cards can render at the exact same
   * x/y (stock, waste, foundations), and leaving them all interactive
   * makes a single tap resolve to an unpredictable number of overlapping
   * hit areas instead of just the top one.
   */
  setInputEnabled(enabled: boolean): void {
    if (enabled) {
      this.bg.setInteractive({ useHandCursor: true });
    } else {
      this.bg.disableInteractive();
    }
  }
}
