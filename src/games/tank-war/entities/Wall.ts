import Phaser from "phaser";
import { GB } from "../../../config/AppConfig";
import { ARENA, TW_COLORS } from "../config";

export class Wall extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ARENA.CELL - 2, ARENA.CELL - 2, TW_COLORS.WALL);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setStrokeStyle(2, GB.DARKEST);
  }
}
