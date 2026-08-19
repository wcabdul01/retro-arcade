import Phaser from "phaser";
import { GB } from "../config/AppConfig";
import { sfx } from "../systems/SoundManager";

export type DPadDirection = "up" | "down" | "left" | "right";

export interface DPadOptions {
  onPress: (dir: DPadDirection) => void;
  onRelease?: (dir: DPadDirection) => void;
  size?: number;
}

export function createDPad(scene: Phaser.Scene, centerX: number, centerY: number, options: DPadOptions): void {
  const size = options.size ?? 136;
  const arm = size / 3;

  const g = scene.add.graphics();
  g.fillStyle(GB.DARK, 1);
  g.lineStyle(3, GB.DARKEST, 1);
  g.fillRect(centerX - arm / 2, centerY - size / 2, arm, size);
  g.strokeRect(centerX - arm / 2, centerY - size / 2, arm, size);
  g.fillRect(centerX - size / 2, centerY - arm / 2, size, arm);
  g.strokeRect(centerX - size / 2, centerY - arm / 2, size, arm);
  g.fillStyle(GB.DARKEST, 1);
  g.fillRect(centerX - arm / 2 + 3, centerY - arm / 2 + 3, arm - 6, arm - 6);

  const makeZone = (dir: DPadDirection, dx: number, dy: number, w: number, h: number): void => {
    const zone = scene.add
      .rectangle(centerX + dx, centerY + dy, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      sfx.move();
      options.onPress(dir);
    });
    if (options.onRelease) {
      const release = options.onRelease;
      zone.on("pointerup", () => release(dir));
      zone.on("pointerout", () => release(dir));
    }
  };

  makeZone("up", 0, -size / 2 + arm / 2, arm, arm);
  makeZone("down", 0, size / 2 - arm / 2, arm, arm);
  makeZone("left", -size / 2 + arm / 2, 0, arm, arm);
  makeZone("right", size / 2 - arm / 2, 0, arm, arm);
}
