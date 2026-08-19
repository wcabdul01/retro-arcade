import Phaser from "phaser";
import { GAME_WIDTH, FONT_FAMILY, COLORS } from "../../../config/AppConfig";
import { createButton } from "../../../ui/createButton";
import { AdsManager } from "../../../systems/AdsManager";
import type { Grid } from "../engine";

interface ResumeState {
  difficultyIndex: number;
  score: number;
  puzzle: Grid;
  solution: Grid;
  current: Grid;
  filledCount: number;
  totalEmpty: number;
}

interface GameOverData {
  win: boolean;
  score: number;
  highScore: number;
  resumeState?: ResumeState;
}

export class GameOverScene extends Phaser.Scene {
  private continuing = false;

  constructor() {
    super("Sudoku.GameOver");
  }

  create(data: GameOverData): void {
    this.continuing = false;
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    const title = data.win ? "SOLVED!" : "OUT OF LIVES";
    const color = data.win ? "#545a41" : "#16170f";

    this.add.text(GAME_WIDTH / 2, 220, title, { fontFamily: FONT_FAMILY, fontSize: "20px", color }).setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 280, `Score: ${data.score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 320, `High Score: ${data.highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    let nextY = 420;
    if (!data.win && data.resumeState) {
      const resumeState = data.resumeState;
      const adText = this.add
        .text(GAME_WIDTH / 2, nextY - 34, "", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#545a41" })
        .setOrigin(0.5);
      createButton(this, GAME_WIDTH / 2, nextY, "WATCH AD: CONTINUE", () => {
        if (this.continuing) return;
        this.continuing = true;
        AdsManager.showRewarded(
          () => {
            this.scene.start("Sudoku.Game", { continueState: resumeState });
          },
          () => {
            this.continuing = false;
            adText.setText("Ad not available right now");
          }
        );
      });
      nextY += 70;
    }

    createButton(this, GAME_WIDTH / 2, nextY, "PLAY AGAIN", () => {
      this.scene.start("Sudoku.Difficulty");
    });
    createButton(this, GAME_WIDTH / 2, nextY + 70, "MAIN MENU", () => {
      this.scene.start("Hub");
    });
  }
}
