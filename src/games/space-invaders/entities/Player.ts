import Phaser from "phaser";
import { PLAYER, SI_COLORS } from "../config";
import { PLAYFIELD_X, PLAYFIELD_RIGHT } from "../../../ui/controlLayout";

export class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER.WIDTH, PLAYER.HEIGHT, SI_COLORS.PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;
  }

  moveTo(targetX: number): void {
    const half = this.width / 2;
    const clamped = Phaser.Math.Clamp(targetX, PLAYFIELD_X + half, PLAYFIELD_RIGHT - half);
    (this.body as Phaser.Physics.Arcade.Body).reset(clamped, this.y);
  }
}
