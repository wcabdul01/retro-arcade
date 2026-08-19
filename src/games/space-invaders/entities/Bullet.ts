import Phaser from "phaser";
import { BULLET, SI_COLORS } from "../config";

export type BulletOwner = "player" | "invader";

export class Bullet extends Phaser.GameObjects.Rectangle {
  owner: BulletOwner;

  constructor(scene: Phaser.Scene, x: number, y: number, owner: BulletOwner) {
    super(
      scene,
      x,
      y,
      BULLET.WIDTH,
      BULLET.HEIGHT,
      owner === "player" ? SI_COLORS.BULLET_PLAYER : SI_COLORS.BULLET_INVADER
    );
    this.owner = owner;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setVelocityY(owner === "player" ? -BULLET.PLAYER_SPEED : BULLET.INVADER_SPEED);
  }
}
