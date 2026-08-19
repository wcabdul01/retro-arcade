import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";

interface GameOverData {
  score: number;
  highScore: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("InvertedTetris.GameOver");
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.add
      .text(GAME_WIDTH / 2, 240, "BURIED!", { fontFamily: FONT_FAMILY, fontSize: "20px", color: "#16170f" })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 300, `Score: ${data.score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 332, `High Score: ${data.highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 440, "Play Again", () => {
      this.scene.start("InvertedTetris.Game");
    });
    createButton(this, GAME_WIDTH / 2, 510, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
