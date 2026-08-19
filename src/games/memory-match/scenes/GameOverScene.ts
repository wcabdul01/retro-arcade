import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";

interface GameOverData {
  win: boolean;
  score: number;
  highScore: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("MemoryMatch.GameOver");
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    const title = data.win ? "ALL MATCHED!" : "TIME'S UP";
    const color = data.win ? "#545a41" : "#16170f";

    this.add.text(GAME_WIDTH / 2, 240, title, { fontFamily: FONT_FAMILY, fontSize: "18px", color }).setOrigin(0.5);
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
      this.scene.start("MemoryMatch.Difficulty");
    });
    createButton(this, GAME_WIDTH / 2, 510, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
