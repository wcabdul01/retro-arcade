import Phaser from "phaser";
import { BULLET, TW_COLORS } from "../config";
import type { Direction } from "./Tank";

export type BulletOwner = "player" | "enemy";

export class Bullet extends Phaser.GameObjects.Rectangle {
  owner: BulletOwner;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: Direction, owner: BulletOwner) {
    super(scene, x, y, BULLET.SIZE, BULLET.SIZE, owner === "player" ? TW_COLORS.BULLET_PLAYER : TW_COLORS.BULLET_ENEMY);
    this.owner = owner;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    const v = BULLET.SPEED;
    switch (dir) {
      case "up":
        body.setVelocity(0, -v);
        break;
      case "down":
        body.setVelocity(0, v);
        break;
      case "left":
        body.setVelocity(-v, 0);
        break;
      case "right":
        body.setVelocity(v, 0);
        break;
    }
  }
}
