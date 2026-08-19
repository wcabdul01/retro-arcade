import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";
import { AdsManager } from "../../../systems/AdsManager";

interface GameOverData {
  score: number;
  highScore: number;
  wave: number;
}

export class GameOverScene extends Phaser.Scene {
  private continuing = false;

  constructor() {
    super("SpaceInvaders.GameOver");
  }

  create(data: GameOverData): void {
    this.continuing = false;
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.add
      .text(GAME_WIDTH / 2, 220, "GAME OVER", { fontFamily: FONT_FAMILY, fontSize: "20px", color: "#16170f" })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 280, `Score: ${data.score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 312, `High Score: ${data.highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    const adText = this.add
      .text(GAME_WIDTH / 2, 386, "", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" })
      .setOrigin(0.5);
    createButton(this, GAME_WIDTH / 2, 420, "Watch Ad: Continue", () => {
      if (this.continuing) return;
      this.continuing = true;
      AdsManager.showRewarded(
        () => {
          this.scene.start("SpaceInvaders.Game", { score: data.score, wave: data.wave, lives: 1 });
        },
        () => {
          this.continuing = false;
          adText.setText("Ad not available right now");
        }
      );
    });

    createButton(this, GAME_WIDTH / 2, 490, "Play Again", () => {
      this.scene.start("SpaceInvaders.Game");
    });
    createButton(this, GAME_WIDTH / 2, 560, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
