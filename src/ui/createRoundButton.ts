import Phaser from "phaser";
import { GB, FONT_FAMILY } from "../config/AppConfig";

export function createRoundButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  radius = 30
): Phaser.GameObjects.Arc {
  const btn = scene.add
    .circle(x, y, radius, GB.DARK)
    .setStrokeStyle(3, GB.DARKEST)
    .setInteractive({ useHandCursor: true });

  scene.add
    .circle(x - radius * 0.28, y - radius * 0.32, radius * 0.32, GB.LIGHT, 0.3)
    .setDepth(btn.depth + 1);

  scene.add
    .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#9ba17c" })
    .setOrigin(0.5)
    .setDepth(btn.depth + 1);

  btn.on("pointerover", () => btn.setFillStyle(GB.DARKEST));
  btn.on("pointerout", () => btn.setFillStyle(GB.DARK));
  btn.on("pointerdown", () => {
    btn.setFillStyle(GB.DARKEST);
    onClick();
  });
  btn.on("pointerup", () => btn.setFillStyle(GB.DARK));

  return btn;
}
