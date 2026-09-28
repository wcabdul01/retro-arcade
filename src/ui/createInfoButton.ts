import Phaser from "phaser";
import { GB, FONT_FAMILY } from "../config/AppConfig";
import { sfx } from "../systems/SoundManager";
import { Settings } from "../systems/Settings";
import { PAUSE_BUTTON_X, PAUSE_BUTTON_Y } from "./createPauseButton";

const SIZE = 32;
const GAP = 8;
export const INFO_BUTTON_X = PAUSE_BUTTON_X - SIZE - GAP;
export const INFO_BUTTON_Y = PAUSE_BUTTON_Y;

// Sits immediately left of the pause button. Pauses the game and opens the
// shared HowToPlayScene with this game's own title/instructions. The first
// time a player opens each game, the card also opens by itself once the
// scene has finished creating -- a lightweight walkthrough for new players.
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
  const open = (firstTime: boolean): void => {
    scene.scene.pause();
    scene.scene.launch("HowToPlay", {
      title,
      howToPlay,
      returnSceneKey: scene.scene.key,
      closeLabel: firstTime ? "GOT IT" : undefined,
    });
  };

  bg.on("pointerdown", () => {
    sfx.select();
    open(false);
  });

  if (!Settings.hasSeenHowToPlay(title)) {
    Settings.markHowToPlaySeen(title);
    scene.events.once(Phaser.Scenes.Events.CREATE, () => open(true));
  }
}
