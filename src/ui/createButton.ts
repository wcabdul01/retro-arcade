import Phaser from "phaser";
import { GB, FONT_FAMILY } from "../config/AppConfig";
import { sfx } from "../systems/SoundManager";

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options?: { width?: number; height?: number }
): Phaser.GameObjects.Rectangle {
  const width = options?.width ?? 260;
  const height = options?.height ?? 56;

  const bg = scene.add
    .rectangle(x, y, width, height, GB.DARK)
    .setStrokeStyle(4, GB.DARKEST)
    .setInteractive({ useHandCursor: true });

  scene.add
    .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#9ba17c" })
    .setOrigin(0.5);

  bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
  bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
  bg.on("pointerdown", () => {
    sfx.select();
    onClick();
  });

  return bg;
}
