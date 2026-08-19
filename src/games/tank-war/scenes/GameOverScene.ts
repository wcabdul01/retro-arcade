import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";
import { AdsManager } from "../../../systems/AdsManager";

interface GameOverData {
  win: boolean;
  score: number;
  highScore: number;
  levelIndex: number;
}

export class GameOverScene extends Phaser.Scene {
  private continuing = false;

  constructor() {
    super("TankWar.GameOver");
  }

  create(data: GameOverData): void {
    this.continuing = false;
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    const title = data.win ? "VICTORY!" : "TANK DESTROYED";
    const color = data.win ? "#545a41" : "#16170f";

    this.add.text(GAME_WIDTH / 2, 220, title, { fontFamily: FONT_FAMILY, fontSize: "18px", color }).setOrigin(0.5);
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
            this.scene.start("TankWar.Game", { levelIndex: data.levelIndex, score: data.score, lives: 1 });
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
      this.scene.start("TankWar.Game");
    });
    createButton(this, GAME_WIDTH / 2, nextY + 70, "Main Menu", () => {
      this.scene.start("Hub");
    });
  }
}
