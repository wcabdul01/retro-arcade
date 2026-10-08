import Phaser from "phaser";
import { GB, COLORS, FONT_FAMILY, GAME_WIDTH, GAME_HEIGHT, CONTENT_MARGIN } from "../config/AppConfig";
import { GAMES } from "./gameRegistry";
import type { SaveData } from "../platform";
import { sfx } from "../systems/SoundManager";
import { AdsManager } from "../systems/AdsManager";
import { EventBus } from "../systems/EventBus";
import { SAVE_DATA_CHANGED } from "../systems/CloudSave";
import { createButton } from "../ui/createButton";
import { drawGearIcon } from "../ui/icons";
import { canExitApp, exitApp } from "../platform/exitApp";

const TILE_WIDTH = 210;
const TILE_HEIGHT = 96;
const GAP = 12;
const COLS = 2;
const EXIT_BUTTON_HEIGHT = 56;
const SETTINGS_BUTTON_SIZE = 40;

// Layout block is authored top-anchored (title -> subtitle -> tile grid ->
// exit button), then shifted as a whole so it sits vertically centered in
// the canvas instead of hugging the top with empty space below. The settings
// gear sits in the top-right corner, where games put their pause button.
const TITLE_Y = 66;
const TITLE_BLOCK_HEIGHT = 60; // two 22px lines + line spacing
const SUBTITLE_Y = 122;
const GRID_TOP = 150;
const GRID_ROWS = Math.ceil(GAMES.length / COLS);
const GRID_BOTTOM = GRID_TOP + GRID_ROWS * (TILE_HEIGHT + GAP) - GAP;
const EXIT_GAP = 34;
const EXIT_Y = GRID_BOTTOM + EXIT_GAP + EXIT_BUTTON_HEIGHT / 2;

const CONTENT_TOP = TITLE_Y - TITLE_BLOCK_HEIGHT / 2;
const CONTENT_BOTTOM = EXIT_Y + EXIT_BUTTON_HEIGHT / 2;
const OFFSET_Y = (GAME_HEIGHT - (CONTENT_BOTTOM - CONTENT_TOP)) / 2 - CONTENT_TOP;

export class HubScene extends Phaser.Scene {
  constructor() {
    super("Hub");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    AdsManager.showBanner();
    const saveData = this.registry.get("saveData") as SaveData | undefined;

    this.add
      .text(GAME_WIDTH / 2, TITLE_Y + OFFSET_Y, "RETRO\nARCADE", {
        fontFamily: FONT_FAMILY,
        fontSize: "22px",
        color: "#16170f",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, SUBTITLE_Y + OFFSET_Y, "PICK A GAME", {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#545a41",
      })
      .setOrigin(0.5);

    const totalGridWidth = COLS * TILE_WIDTH + (COLS - 1) * GAP;
    const startX = (GAME_WIDTH - totalGridWidth) / 2 + TILE_WIDTH / 2;

    GAMES.forEach((game, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = startX + col * (TILE_WIDTH + GAP);
      const y = GRID_TOP + OFFSET_Y + row * (TILE_HEIGHT + GAP) + TILE_HEIGHT / 2;
      const highScore = saveData?.highScores[game.id];

      this.createTile(x, y, game.title, game.tagline, highScore, () => {
        this.scene.start("Intro", {
          title: game.title,
          tagline: game.tagline,
          nextScene: game.entryScene,
        });
      });
    });

    this.createSettingsButton();

    // Redraw when the cloud save brings back high scores.
    const redraw = () => this.scene.restart();
    EventBus.on(SAVE_DATA_CHANGED, redraw);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(SAVE_DATA_CHANGED, redraw));

    if (canExitApp()) {
      createButton(this, GAME_WIDTH / 2, EXIT_Y + OFFSET_Y, "EXIT", () => {
        exitApp(() => {
          // Web fallback: window.close() already attempted; nothing else to do here.
        });
      });
    }
  }

  /** Gear button in the top-right corner; Settings also holds Remove Ads. */
  private createSettingsButton(): void {
    const x = GAME_WIDTH - CONTENT_MARGIN - SETTINGS_BUTTON_SIZE / 2;
    const y = CONTENT_MARGIN + SETTINGS_BUTTON_SIZE / 2;
    const bg = this.add
      .rectangle(x, y, SETTINGS_BUTTON_SIZE, SETTINGS_BUTTON_SIZE, GB.DARK)
      .setStrokeStyle(3, GB.DARKEST)
      .setInteractive({ useHandCursor: true });
    drawGearIcon(this, x, y, 24);
    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => {
      sfx.select();
      this.scene.launch("Settings");
    });
  }

  private createTile(
    x: number,
    y: number,
    title: string,
    tagline: string,
    highScore: number | undefined,
    onClick: () => void
  ): void {
    const bg = this.add
      .rectangle(x, y, TILE_WIDTH, TILE_HEIGHT, GB.LIGHT)
      .setStrokeStyle(3, GB.DARKEST)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y - 22, title.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#16170f",
        align: "center",
        wordWrap: { width: TILE_WIDTH - 28 },
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 8, tagline, {
        fontFamily: FONT_FAMILY,
        fontSize: "8px",
        color: "#545a41",
        align: "center",
        wordWrap: { width: TILE_WIDTH - 28 },
      })
      .setOrigin(0.5);

    if (highScore !== undefined) {
      this.add
        .text(x, y + TILE_HEIGHT / 2 - 14, `BEST ${highScore}`, {
          fontFamily: FONT_FAMILY,
          fontSize: "8px",
          color: "#16170f",
        })
        .setOrigin(0.5);
    }

    bg.on("pointerover", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerout", () => bg.setFillStyle(GB.LIGHT));
    bg.on("pointerdown", () => {
      sfx.select();
      onClick();
    });
  }
}
