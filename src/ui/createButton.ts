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

  const text = scene.add
    .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: "12px", color: "#9ba17c" })
    .setOrigin(0.5);

  // Canvas text is drawn once at creation using whatever font the browser
  // resolves at that instant. A known, unresolved bug (see main.ts) can
  // make that first render use the system fallback font instead of "Press
  // Start 2P" even after document.fonts reports it loaded. Re-setting the
  // text once fonts.ready settles is a cheap, harmless attempt at a
  // redraw — on-device testing showed it does NOT reliably fix the known
  // repro, so don't treat this as a real fix, just a low-cost mitigation
  // left in in case it helps on other devices/timings.
  void document.fonts.ready.then(() => {
    if (text.active) text.setText(label);
  });

  bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
  bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
  bg.on("pointerdown", () => {
    sfx.select();
    onClick();
  });

  return bg;
}
