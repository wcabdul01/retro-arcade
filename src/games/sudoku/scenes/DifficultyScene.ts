import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS as APP_COLORS } from "../../../config/AppConfig";
import { DIFFICULTIES } from "../config";
import { createButton } from "../../../ui/createButton";

// Authored top-anchored, then shifted as a block so it sits centered in the
// canvas instead of hugging the top (see HubScene for the same pattern).
const TITLE_Y = 140;
const SUBTITLE_Y = 178;
const BUTTONS_START_Y = 260;
const BUTTON_GAP = 70;
const BUTTON_HEIGHT = 56;

const CONTENT_TOP = TITLE_Y - 30;
const CONTENT_BOTTOM = BUTTONS_START_Y + (DIFFICULTIES.length - 1) * BUTTON_GAP + BUTTON_HEIGHT / 2;
const OFFSET_Y = (GAME_HEIGHT - (CONTENT_BOTTOM - CONTENT_TOP)) / 2 - CONTENT_TOP;

export class DifficultyScene extends Phaser.Scene {
  constructor() {
    super("Sudoku.Difficulty");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);

    this.add
      .text(GAME_WIDTH / 2, TITLE_Y + OFFSET_Y, "SUDOKU", { fontFamily: FONT_FAMILY, fontSize: "20px", color: "#16170f" })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, SUBTITLE_Y + OFFSET_Y, "SELECT DIFFICULTY", {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    DIFFICULTIES.forEach((level, index) => {
      createButton(this, GAME_WIDTH / 2, BUTTONS_START_Y + OFFSET_Y + index * BUTTON_GAP, level.name.toUpperCase(), () => {
        this.scene.start("Sudoku.Game", { difficultyIndex: index });
      });
    });
  }
}
