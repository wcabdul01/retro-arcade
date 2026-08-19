import Phaser from "phaser";
import { PADDLE, BB_COLORS } from "../config";
import { PLAYFIELD_X, PLAYFIELD_RIGHT } from "../../../ui/controlLayout";

export class Paddle extends Phaser.GameObjects.Rectangle {
  isSticky = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PADDLE.WIDTH, PADDLE.HEIGHT, BB_COLORS.PADDLE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;
    body.setCollideWorldBounds(true);
  }

  moveTo(targetX: number): void {
    const halfWidth = this.width / 2;
    const clamped = Phaser.Math.Clamp(targetX, PLAYFIELD_X + halfWidth, PLAYFIELD_RIGHT - halfWidth);
    (this.body as Phaser.Physics.Arcade.Body).reset(clamped, this.y);
  }

  setWidthFactor(factor: number): void {
    const clampedWidth = Phaser.Math.Clamp(PADDLE.WIDTH * factor, PADDLE.MIN_WIDTH, PADDLE.MAX_WIDTH);
    this.setSize(clampedWidth, this.height);
    (this.body as Phaser.Physics.Arcade.Body).setSize(clampedWidth, this.height);
  }

  resetWidth(): void {
    this.setWidthFactor(1);
  }
}
