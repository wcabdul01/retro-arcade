import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/AppConfig";

const CELL = 4;

export class LcdOverlayScene extends Phaser.Scene {
  constructor() {
    super("Overlay");
  }

  create(): void {
    const g = this.add.graphics();

    g.fillStyle(0x000000, 0.05);
    for (let x = 0; x < GAME_WIDTH; x += CELL) {
      g.fillRect(x, 0, 1, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += CELL) {
      g.fillRect(0, y, GAME_WIDTH, 1);
    }
  }
}
