import Phaser from "phaser";
import { GB, FONT_FAMILY } from "../config/AppConfig";
import { sfx } from "../systems/SoundManager";
import { PAUSE_BUTTON_X, PAUSE_BUTTON_Y } from "./createPauseButton";

const SIZE = 32;
const GAP = 8;
export const INFO_BUTTON_X = PAUSE_BUTTON_X - SIZE - GAP;
export const INFO_BUTTON_Y = PAUSE_BUTTON_Y;

// Sits immediately left of the pause button. Pauses the game and opens the
// shared HowToPlayScene with this game's own title/instructions.
export function createInfoButton(scene: Phaser.Scene, title: string, howToPlay: string): void {
  const bg = scene.add
    .rectangle(INFO_BUTTON_X, INFO_BUTTON_Y, SIZE, SIZE, GB.DARK)
    .setStrokeStyle(3, GB.DARKEST)
    .setInteractive({ useHandCursor: true })
    .setDepth(900);

  scene.add
    .text(INFO_BUTTON_X, INFO_BUTTON_Y, "?", { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#9ba17c" })
    .setOrigin(0.5)
    .setDepth(901);

  bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
  bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
  bg.on("pointerdown", () => {
    sfx.select();
    const gameSceneKey = scene.scene.key;
    scene.scene.pause();
    scene.scene.launch("HowToPlay", { title, howToPlay, returnSceneKey: gameSceneKey });
  });
}
