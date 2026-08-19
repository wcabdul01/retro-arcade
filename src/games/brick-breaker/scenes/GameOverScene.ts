import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";
import { AdsManager } from "../../../systems/AdsManager";
import { ScoreManager } from "../systems/ScoreManager";

interface GameOverData {
  win: boolean;
  score: number;
  highScore: number;
  levelIndex: number;
}

export class GameOverScene extends Phaser.Scene {
  private continuing = false;

  constructor() {
    super("BrickBreaker.GameOver");
  }

  create(data: GameOverData): void {
    this.continuing = false;
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    const title = data.win ? "YOU WIN!" : "GAME OVER";
    const color = data.win ? "#545a41" : "#16170f";

    this.add
      .text(GAME_WIDTH / 2, 220, title, { fontFamily: FONT_FAMILY, fontSize: "22px", color })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 290, `Score: ${data.score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 324, `High Score: ${data.highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    let nextY = 420;
    if (!data.win) {
      const adText = this.add
        .text(GAME_WIDTH / 2, nextY - 34, "", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" })
        .setOrigin(0.5);
      createButton(this, GAME_WIDTH / 2, nextY, "Watch Ad: Continue", () => {
        if (this.continuing) return;
        this.continuing = true;
        AdsManager.showRewarded(
          () => {
            const scoreManager = new ScoreManager();
            scoreManager.levelIndex = data.levelIndex;
            scoreManager.score = data.score;
            scoreManager.lives = 1;
            this.scene.start("BrickBreaker.Game", { levelIndex: data.levelIndex, scoreManager });
          },
          () => {
            this.continuing = false;
            adText.setText("Ad not available right now");
          }
        );
      });
      nextY += 70;
    }

    createButton(this, GAME_WIDTH / 2, nextY, "Play Again", () => {
      this.scene.start("BrickBreaker.Game", { levelIndex: 0 });
    });
    createButton(this, GAME_WIDTH / 2, nextY + 70, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
