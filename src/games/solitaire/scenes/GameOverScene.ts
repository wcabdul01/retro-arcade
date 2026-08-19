import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";

interface GameOverData {
  score: number;
  highScore: number;
  moves: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("Solitaire.GameOver");
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

    this.add
      .text(GAME_WIDTH / 2, 240, "SOLVED!", { fontFamily: FONT_FAMILY, fontSize: "22px", color: "#545a41" })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 300, `Score: ${data.score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 332, `Moves: ${data.moves}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 360, `High Score: ${data.highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, 460, "Play Again", () => {
      this.scene.start("Solitaire.Game");
    });
    createButton(this, GAME_WIDTH / 2, 530, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
