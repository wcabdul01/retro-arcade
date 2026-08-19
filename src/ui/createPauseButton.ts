import Phaser from "phaser";
import { GB, GAME_WIDTH, CONTENT_MARGIN } from "../config/AppConfig";
import { sfx } from "../systems/SoundManager";

const SIZE = 32;
export const PAUSE_BUTTON_X = GAME_WIDTH - CONTENT_MARGIN - SIZE / 2;
export const PAUSE_BUTTON_Y = CONTENT_MARGIN + SIZE / 2;

export interface PauseButtonOptions {
  uiSceneKey?: string;
}

export function createPauseButton(scene: Phaser.Scene, options?: PauseButtonOptions): void {
  const bg = scene.add
    .rectangle(PAUSE_BUTTON_X, PAUSE_BUTTON_Y, SIZE, SIZE, GB.DARK)
    .setStrokeStyle(3, GB.DARKEST)
    .setInteractive({ useHandCursor: true })
    .setDepth(900);

  const barWidth = 5;
  const barHeight = 16;
  const barGap = 6;
  scene.add
    .rectangle(PAUSE_BUTTON_X - barGap / 2 - barWidth / 2, PAUSE_BUTTON_Y, barWidth, barHeight, GB.LIGHTEST)
    .setDepth(901);
  scene.add
    .rectangle(PAUSE_BUTTON_X + barGap / 2 + barWidth / 2, PAUSE_BUTTON_Y, barWidth, barHeight, GB.LIGHTEST)
    .setDepth(901);

  bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
  bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
  bg.on("pointerdown", () => {
    sfx.select();
    const gameSceneKey = scene.scene.key;
    scene.scene.pause();
    scene.scene.launch("Pause", { returnSceneKey: gameSceneKey, uiSceneKey: options?.uiSceneKey });
  });
}
