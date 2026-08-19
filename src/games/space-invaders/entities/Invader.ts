import Phaser from "phaser";
import { FLEET } from "../config";

export class Invader extends Phaser.GameObjects.Rectangle {
  row: number;
  scoreValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, row: number, color: number) {
    super(scene, x, y, FLEET.CELL_W - 8, FLEET.CELL_H - 10, color);
    this.row = row;
    this.scoreValue = (FLEET.ROWS - row) * 10;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;
  }

  moveBy(dx: number, dy: number): void {
    (this.body as Phaser.Physics.Arcade.Body).reset(this.x + dx, this.y + dy);
  }
}
